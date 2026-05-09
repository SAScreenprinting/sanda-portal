'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function EarthBackground() {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    const width = mount.clientWidth
    const height = mount.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.z = 2.5

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    mount.appendChild(renderer.domElement)

    const geometry = new THREE.SphereGeometry(1, 64, 64)
    const textureLoader = new THREE.TextureLoader()

    const texture = textureLoader.load('/earth.jpg')
    const material = new THREE.MeshBasicMaterial({ map: texture })
    const earth = new THREE.Mesh(geometry, material)
    earth.rotation.x = 0.2
    scene.add(earth)

    // Stars
    const starsGeometry = new THREE.BufferGeometry()
    const starCount = 4000
    const positions = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 300
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12 })
    const stars = new THREE.Points(starsGeometry, starsMaterial)
    scene.add(stars)

    let animationId
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      earth.rotation.y += 0.0008
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  )
}