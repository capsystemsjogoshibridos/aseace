import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Accelerometer, Pedometer } from 'expo-sensors';

type Acceleration = { x: number; y: number; z: number };

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isPedometerAvailable, setIsPedometerAvailable] = useState<boolean | null>(null);
  const [stepCount, setStepCount] = useState(0);
  const [acceleration, setAcceleration] = useState<Acceleration>({ x: 0, y: 0, z: 0 });

  const pedometerSubscription = useRef<ReturnType<typeof Pedometer.watchStepCount> | null>(null);
  const accelerometerSubscription = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);

  useEffect(() => {
    let mounted = true;
    Pedometer.isAvailableAsync()
      .then((available) => {
        if (mounted) setIsPedometerAvailable(available);
      })
      .catch(() => setIsPedometerAvailable(false));
    return () => {
      mounted = false;
    };
  }, []);

  const startMatch = useCallback(async () => {
    try {
      const pedometerPerm = await Pedometer.requestPermissionsAsync();
      if (pedometerPerm.status !== 'granted') setIsPedometerAvailable(false);
    } catch {
      setIsPedometerAvailable(false);
    }

    if (!pedometerSubscription.current && isPedometerAvailable) {
      pedometerSubscription.current = Pedometer.watchStepCount((result) => {
        setStepCount((prev) => prev + result.steps);
      });
    }

    if (!accelerometerSubscription.current) {
      Accelerometer.setUpdateInterval(100);
      accelerometerSubscription.current = Accelerometer.addListener((data) => {
        setAcceleration({ x: data.x, y: data.y, z: data.z });
      });
    }

    setHasStarted(true);
  }, [isPedometerAvailable]);

  const stopMatch = useCallback(() => {
    pedometerSubscription.current?.remove();
    pedometerSubscription.current = null;
    accelerometerSubscription.current?.remove();
    accelerometerSubscription.current = null;
    setHasStarted(false);
    setStepCount(0);
    setAcceleration({ x: 0, y: 0, z: 0 });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {!hasStarted ? (
        <View style={styles.center}>
          <Text style={styles.title}>Tennis Power Ups</Text>
          <Button title="Iniciar partida" onPress={startMatch} />
          {isPedometerAvailable === false && (
            <Text style={styles.hint}>Contador de passos indisponível neste dispositivo.</Text>
          )}
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Partida em andamento</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Passos</Text>
            <Text style={styles.value}>{stepCount}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>Acelerômetro</Text>
            <Text style={styles.valueSmall}>x: {acceleration.x.toFixed(3)}</Text>
            <Text style={styles.valueSmall}>y: {acceleration.y.toFixed(3)}</Text>
            <Text style={styles.valueSmall}>z: {acceleration.z.toFixed(3)}</Text>
          </View>
          <Button title="Parar" onPress={stopMatch} color="#cc0000" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  hint: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 36,
    fontWeight: '700',
  },
  valueSmall: {
    fontSize: 16,
    fontWeight: '600',
  },
});
