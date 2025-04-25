"use client"

import { useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { Sphere, Ring, Text } from "@react-three/drei"
import type * as THREE from "three"
import { useSpring, animated } from "@react-spring/three"

interface Assistant3DProps {
  isSpeaking: boolean
  isLoading: boolean
  theme: string
}

export function Assistant3D({ isSpeaking, isLoading, theme = "blue" }: Assistant3DProps) {
  const sphereRef = useRef<THREE.Mesh>(null)
  const ringsRef = useRef<THREE.Group>(null)

  // Define theme colors
  const themeColors = {
    blue: "#0078d7",
    purple: "#5c2d91",
    green: "#107c10",
    red: "#e81123",
    orange: "#d83b01",
  }

  const color = themeColors[theme as keyof typeof themeColors] || themeColors.blue

  // Animation for speaking/loading state
  const { scale } = useSpring({
    scale: isSpeaking || isLoading ? 1.1 : 1,
    config: { tension: 300, friction: 10 },
  })

  // Gentle floating animation
  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }

    if (ringsRef.current) {
      ringsRef.current.rotation.y = state.clock.elapsedTime * 0.1
      ringsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
    }
  })

  // Pulse animation for rings when speaking or loading
  useEffect(() => {
    const interval = setInterval(() => {
      if (ringsRef.current && (isSpeaking || isLoading)) {
        ringsRef.current.children.forEach((ring, i) => {
          const scale = 1 + Math.sin(Date.now() * 0.005 + i * 0.5) * 0.05
          ring.scale.set(scale, scale, scale)
        })
      }
    }, 16)

    return () => clearInterval(interval)
  }, [isSpeaking, isLoading])

  return (
    <group position={[0, 0, 0]}>
      <animated.mesh ref={sphereRef} scale={scale}>
        <Sphere args={[0.5, 32, 32]}>
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            roughness={0.2}
            metalness={0.8}
          />
        </Sphere>
      </animated.mesh>

      <group ref={ringsRef}>
        {[1, 1.2, 1.4].map((size, i) => (
          <Ring key={i} args={[size, size + 0.02, 64]} rotation={[Math.PI / 2, 0, (i * Math.PI) / 3]}>
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.8}
              transparent
              opacity={0.7 - i * 0.2}
            />
          </Ring>
        ))}
      </group>

      <Text position={[0, -1, 0]} fontSize={0.15} color="white" anchorX="center" anchorY="middle">
        {isLoading ? "Thinking..." : isSpeaking ? "Speaking..." : "Cortana AI"}
      </Text>
    </group>
  )
}
