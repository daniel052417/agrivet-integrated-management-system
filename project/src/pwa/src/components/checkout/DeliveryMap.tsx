// components/DeliveryMap.tsx
// Reusable map component for selecting delivery locations

import React, { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react'

interface DeliveryMapProps {
  initialLocation?: {
    latitude: number
    longitude: number
  }
  onLocationSelect: (location: {
    latitude: number
    longitude: number
    address: string
  }) => void
  className?: string
  height?: string
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({
  initialLocation,
  onLocationSelect,
  className = '',
  height = 'h-96'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number
    longitude: number
    address: string
  } | null>(null)

  // Default center (Cebu City, Philippines)
  const DEFAULT_CENTER: [number, number] = [10.3157, 123.8854]

  useEffect(() => {
    loadLeaflet()
    return () => {
      // Don't remove the map instance on unmount, just hide it
      // This allows reusing the same instance when showing/hiding
    }
  }, [])

  useEffect(() => {
    // When component becomes visible again, invalidate size
    if (mapInstanceRef.current) {
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize()
        }
      }, 100)
    }
  }, [])

  useEffect(() => {
    if (initialLocation && mapInstanceRef.current && markerRef.current) {
      const { latitude, longitude } = initialLocation
      mapInstanceRef.current.setView([latitude, longitude], 15)
      markerRef.current.setLatLng([latitude, longitude])
      reverseGeocode(latitude, longitude)
    }
  }, [initialLocation])

  const loadLeaflet = () => {
    if ((window as any).L) {
      initializeMap()
      return
    }

    // Load Leaflet CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    // Load Leaflet JS
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => initializeMap()
    script.onerror = () => {
      setError('Failed to load map library')
      setIsLoading(false)
    }
    document.body.appendChild(script)
  }

  const initializeMap = () => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    try {
      const L = (window as any).L

      const center: [number, number] = initialLocation
        ? [initialLocation.latitude, initialLocation.longitude]
        : DEFAULT_CENTER

      // Initialize map
      const map = L.map(mapContainerRef.current).setView(center, initialLocation ? 15 : 13)

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map)

      // Add marker
      const marker = L.marker(center, { draggable: true }).addTo(map)

      // Handle marker drag
      marker.on('dragend', async (e: any) => {
        const position = e.target.getLatLng()
        await reverseGeocode(position.lat, position.lng)
      })

      // Handle map click
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        await reverseGeocode(lat, lng)
      })

      mapInstanceRef.current = map
      markerRef.current = marker

      // Invalidate size after a short delay
      setTimeout(() => {
        map.invalidateSize()
        setIsLoading(false)
      }, 100)

      // Get initial address if location provided
      if (initialLocation) {
        reverseGeocode(initialLocation.latitude, initialLocation.longitude)
      }

    } catch (error) {
      console.error('Error initializing map:', error)
      setError('Failed to initialize map')
      setIsLoading(false)
    }
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocodingAddress(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        {
          headers: {
            'User-Agent': 'TiongsonAgrivetPWA/1.0'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Geocoding failed')
      }

      const data = await response.json()
      const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`

      const location = {
        latitude: lat,
        longitude: lng,
        address
      }

      setSelectedLocation(location)
      onLocationSelect(location)
    } catch (error) {
      console.error('Geocoding error:', error)
      const location = {
        latitude: lat,
        longitude: lng,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      }
      setSelectedLocation(location)
      onLocationSelect(location)
    } finally {
      setIsGeocodingAddress(false)
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setIsLoadingLocation(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        if (mapInstanceRef.current && markerRef.current) {
          const L = (window as any).L
          mapInstanceRef.current.setView([latitude, longitude], 15)
          markerRef.current.setLatLng([latitude, longitude])
        }

        await reverseGeocode(latitude, longitude)
        setIsLoadingLocation(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        setError('Unable to get your location. Please select manually on the map.')
        setIsLoadingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-600 flex items-center">
          <MapPin className="w-4 h-4 mr-1" />
          Click on the map or drag the marker to select location
        </p>
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isLoadingLocation || isLoading}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {isLoadingLocation ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Use My Location</span>
        </button>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      <div className="relative">
        <div
          ref={mapContainerRef}
          className={`w-full ${height} rounded-lg border border-gray-300 bg-gray-100`}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
      </div>

      {isGeocodingAddress && (
        <p className="text-sm text-blue-600 mt-2 flex items-center">
          <Loader2 className="w-4 h-4 animate-spin mr-1" />
          Getting address...
        </p>
      )}

      {selectedLocation && (
        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-blue-900 text-sm">Selected Location</p>
              <p className="text-sm text-blue-700 mt-1 break-words">{selectedLocation.address}</p>
              <p className="text-xs text-blue-600 mt-1">
                {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeliveryMap