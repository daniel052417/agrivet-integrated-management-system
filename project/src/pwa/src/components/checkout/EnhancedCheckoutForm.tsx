import React, { useState, useEffect, useRef } from 'react'
import { CreditCard, User, MapPin, Phone, Mail, AlertCircle, CheckCircle, Clock, Truck, Package, Home, Navigation, Search, Save, Loader2 } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useBranch } from '../../contexts/BranchContext'
import { useAuth } from '../../contexts/AuthContext'
import OrderService from '../../services/orderService'

interface EnhancedCheckoutFormProps {
  onOrderCreated: (orderId: string) => void
  onError: (error: string) => void
}

interface DeliveryLocation {
  latitude: number
  longitude: number
  address: string
}

interface SavedAddress {
  id: string
  addressLabel: string
  addressLine1: string
  landmark?: string
  contactNumber?: string
  latitude: number
  longitude: number
  isDefault: boolean
}

const EnhancedCheckoutForm: React.FC<EnhancedCheckoutFormProps> = ({
  onOrderCreated,
  onError
}) => {
  const { cart, clearCart } = useCart()
  const { selectedBranch } = useBranch()
  const { user, isAuthenticated } = useAuth()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState<'customer' | 'delivery' | 'payment' | 'processing' | 'confirmation'>('customer')
  
  // Customer Info
  const [customerInfo, setCustomerInfo] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: ''
  })
  
  // Delivery Info
  const [deliveryInfo, setDeliveryInfo] = useState<{
    method: 'pickup' | 'delivery'
    deliveryMethod?: 'maxim' | 'other'
    address?: string
    contactNumber?: string
    landmark?: string
    latitude?: number
    longitude?: number
  }>({
    method: 'pickup',
    deliveryMethod: 'maxim'
  })
  
  // Payment Info
  const [paymentInfo, setPaymentInfo] = useState({
    method: 'cash',
    notes: ''
  })
  
  // Map State
  const [showMap, setShowMap] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<DeliveryLocation | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  
  // Saved Addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  
  const [orderService] = useState(() => {
    return new OrderService({
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    })
  })
  
  // Load saved addresses for authenticated users
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadSavedAddresses()
    }
  }, [isAuthenticated, user])
  
  const loadSavedAddresses = async () => {
    if (!user?.id) return
    
    setLoadingAddresses(true)
    try {
      const { supabase } = await import('../../services/supabase')
      
      // Get customer_id first
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (customer) {
        const { data: addresses, error } = await supabase
          .from('customer_delivery_addresses')
          .select('*')
          .eq('customer_id', customer.id)
          .eq('is_active', true)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false })
        
        if (!error && addresses) {
          setSavedAddresses(addresses.map(addr => ({
            id: addr.id,
            addressLabel: addr.address_label,
            addressLine1: addr.address_line1,
            landmark: addr.landmark,
            contactNumber: addr.contact_number,
            latitude: parseFloat(addr.latitude),
            longitude: parseFloat(addr.longitude),
            isDefault: addr.is_default
          })))
        }
      }
    } catch (error) {
      console.error('Error loading saved addresses:', error)
    } finally {
      setLoadingAddresses(false)
    }
  }
  
  // Load Leaflet dynamically
  useEffect(() => {
    if (!(window as any).L) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
      
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => {
        console.log('✅ Leaflet loaded successfully')
      }
      document.body.appendChild(script)
    }
  }, [])

  // Initialize map when showMap becomes true and container is available
  useEffect(() => {
    if (!showMap || !mapContainerRef.current || mapInstanceRef.current) return
    
    const initializeMapWhenReady = () => {
      if ((window as any).L && mapContainerRef.current && !mapInstanceRef.current) {
        console.log('🗺️ Initializing map...')
        initializeMap()
      } else if (!(window as any).L) {
        // Wait for Leaflet to load
        setTimeout(initializeMapWhenReady, 100)
      }
    }
    
    initializeMapWhenReady()
  }, [showMap])

  // Handle map visibility changes - invalidate size when shown
  useEffect(() => {
    if (showMap && mapInstanceRef.current) {
      setTimeout(() => {
        if (mapInstanceRef.current) {
          console.log('🗺️ Invalidating map size...')
          mapInstanceRef.current.invalidateSize()
          console.log('✅ Map size invalidated')
        }
      }, 200)
    }
  }, [showMap])

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        console.log('🗺️ Cleaning up map...')
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    }
  }, [])
  
  const initializeMap = () => {
    if (!mapContainerRef.current || mapInstanceRef.current) {
      console.log('❌ Map initialization skipped:', {
        hasContainer: !!mapContainerRef.current,
        hasInstance: !!mapInstanceRef.current
      })
      return
    }
    
    try {
      const L = (window as any).L
      
      if (!L) {
        console.error('❌ Leaflet not loaded')
        setMapError('Map library not loaded. Please refresh the page.')
        return
      }
      
      console.log('🗺️ Creating map instance...')
      
      // Default center (Cebu City, Philippines)
      const defaultCenter: [number, number] = [10.3157, 123.8854]
      
      // Initialize map
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true
      }).setView(
        selectedLocation ? [selectedLocation.latitude, selectedLocation.longitude] : defaultCenter,
        selectedLocation ? 15 : 13
      )
      
      console.log('🗺️ Map created, adding tiles...')
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map)
      
      console.log('🗺️ Tiles added, creating marker...')
      
      // Add marker
      const marker = L.marker(
        selectedLocation ? [selectedLocation.latitude, selectedLocation.longitude] : defaultCenter,
        { draggable: true }
      ).addTo(map)
      
      console.log('🗺️ Marker added, setting up events...')
      
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
      
      console.log('✅ Map initialized successfully')
      
      // Invalidate size after a short delay
      setTimeout(() => {
        if (mapInstanceRef.current) {
          console.log('🗺️ Invalidating map size after initialization...')
          mapInstanceRef.current.invalidateSize()
        }
      }, 300)
      
    } catch (error) {
      console.error('❌ Error initializing map:', error)
      setMapError('Failed to load map. Please try again.')
    }
  }
  
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocodingAddress(true)
    try {
      // Using Nominatim for reverse geocoding (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        {
          headers: {
            'User-Agent': 'TiongsonAgrivetPWA/1.0'
          }
        }
      )
      const data = await response.json()
      
      const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      
      setSelectedLocation({
        latitude: lat,
        longitude: lng,
        address
      })
      
      setDeliveryInfo(prev => ({
        ...prev,
        address,
        latitude: lat,
        longitude: lng
      }))
    } catch (error) {
      console.error('Geocoding error:', error)
      setSelectedLocation({
        latitude: lat,
        longitude: lng,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      })
    } finally {
      setIsGeocodingAddress(false)
    }
  }
  
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapError('Geolocation is not supported by your browser')
      return
    }
    
    setIsLoadingLocation(true)
    setMapError(null)
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        // Update map
        if (mapInstanceRef.current && markerRef.current) {
          const L = (window as any).L
          mapInstanceRef.current.setView([latitude, longitude], 15)
          markerRef.current.setLatLng([latitude, longitude])
        } else {
          // If map not open, just show it with the location
          setShowMap(true)
        }
        
        await reverseGeocode(latitude, longitude)
        setIsLoadingLocation(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        setMapError('Unable to get your location. Please select manually on the map.')
        setIsLoadingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }
  
  const selectSavedAddress = (address: SavedAddress) => {
    setDeliveryInfo(prev => ({
      ...prev,
      address: address.addressLine1,
      contactNumber: address.contactNumber || prev.contactNumber,
      landmark: address.landmark || prev.landmark,
      latitude: address.latitude,
      longitude: address.longitude
    }))
    
    setSelectedLocation({
      latitude: address.latitude,
      longitude: address.longitude,
      address: address.addressLine1
    })
    
    // Update map if open
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([address.latitude, address.longitude], 15)
      markerRef.current.setLatLng([address.latitude, address.longitude])
    }
  }
  
  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!customerInfo.firstName.trim() || !customerInfo.lastName.trim()) {
      onError('Please fill in all required fields')
      return
    }

    setCurrentStep('delivery')
  }

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (deliveryInfo.method === 'delivery') {
      if (!deliveryInfo.address?.trim() || !deliveryInfo.contactNumber?.trim()) {
        onError('Please fill in all required delivery fields')
        return
      }
      
      if (!deliveryInfo.latitude || !deliveryInfo.longitude) {
        onError('Please select a delivery location on the map')
        return
      }
    }

    setCurrentStep('payment')
  }

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (paymentInfo.method !== 'cash') {
      onError('Only cash payments are currently supported')
      return
    }

    setCurrentStep('processing')
    processOrder()
  }

  const processOrder = async () => {
    console.log('🚀 Starting order processing...')
    
    if (!selectedBranch) {
      console.error('❌ No branch selected')
      onError('No branch selected')
      return
    }
  
    console.log('✅ Branch selected:', selectedBranch.id, selectedBranch.name)
    setIsProcessing(true)
  
    try {
      let customerId: string | undefined = undefined
      
      if (user?.id) {
        console.log('👤 User authenticated:', user.id, user.email)
        const { supabase } = await import('../../services/supabase')
        
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        if (customer && !customerError) {
          customerId = customer.id
          console.log('✅ Found customer ID:', customerId)
        } else {
          console.warn('⚠️ No customer record found for authenticated user:', customerError)
        }
      } else {
        console.log('👤 Guest user - no authentication')
      }
  
      console.log('📦 Cart data:', {
        itemCount: cart.itemCount,
        subtotal: cart.subtotal,
        total: cart.total,
        items: cart.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.unitPrice
        }))
      })
      
      console.log('🏪 Order details:', {
        branchId: selectedBranch.id,
        paymentMethod: paymentInfo.method,
        orderType: deliveryInfo.method,
        customerInfo: {
          firstName: customerInfo.firstName.trim(),
          lastName: customerInfo.lastName.trim(),
          email: customerInfo.email?.trim(),
          phone: customerInfo.phone?.trim()
        }
      })
  
      console.log('🔄 Calling orderService.createOrder...')
      const result = await orderService.createOrder({
        cart,
        customerId: customerId,
        branchId: selectedBranch.id,
        paymentMethod: paymentInfo.method,
        notes: paymentInfo.notes?.trim() || undefined,
        customerInfo: {
          firstName: customerInfo.firstName.trim(),
          lastName: customerInfo.lastName.trim(),
          email: customerInfo.email?.trim() || undefined,
          phone: customerInfo.phone?.trim() || undefined
        },
        orderType: deliveryInfo.method,
        deliveryMethod: deliveryInfo.method === 'delivery' ? deliveryInfo.deliveryMethod : undefined,
        deliveryAddress: deliveryInfo.method === 'delivery' ? deliveryInfo.address?.trim() : undefined,
        deliveryContactNumber: deliveryInfo.method === 'delivery' ? deliveryInfo.contactNumber?.trim() : undefined,
        deliveryLandmark: deliveryInfo.method === 'delivery' ? deliveryInfo.landmark?.trim() : undefined,
        deliveryStatus: deliveryInfo.method === 'delivery' ? 'pending' : undefined,
        deliveryLatitude: deliveryInfo.method === 'delivery' ? deliveryInfo.latitude : undefined,
        deliveryLongitude: deliveryInfo.method === 'delivery' ? deliveryInfo.longitude : undefined
      })
  
      console.log('📋 Order service result:', result)
  
      if (result.success && result.orderId) {
        console.log('✅ Order created successfully:', result.orderId)
        await clearCart()
        setCurrentStep('confirmation')
        onOrderCreated(result.orderId)
      } else {
        console.error('❌ Order creation failed:', result.error)
        onError(result.error || 'Failed to create order')
        setCurrentStep('payment')
      }
    } catch (error) {
      console.error('💥 Order processing error:', error)
      onError('An unexpected error occurred. Please try again.')
      setCurrentStep('payment')
    } finally {
      console.log('🏁 Order processing completed')
      setIsProcessing(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price)
  }

  // Customer Step
  if (currentStep === 'customer') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Customer Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={customerInfo.firstName}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={customerInfo.lastName}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Items ({cart.itemCount})</span>
              <span className="font-medium">{formatPrice(cart.subtotal)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleCustomerSubmit}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <User className="w-4 h-4" />
          <span>Continue to Delivery</span>
        </button>
      </div>
    )
  }
  
  // Delivery Step
  if (currentStep === 'delivery') {
    return (
      <div className="space-y-6">
        {/* Delivery Method Selection */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Truck className="w-5 h-5 mr-2" />
            Delivery Method
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`flex items-center space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50 ${
              deliveryInfo.method === 'pickup' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}>
              <input
                type="radio"
                checked={deliveryInfo.method === 'pickup'}
                onChange={() => setDeliveryInfo(prev => ({ ...prev, method: 'pickup' }))}
                className="w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Home className="w-5 h-5" />
                  <div>
                    <div className="font-medium">Pick up in store</div>
                    <div className="text-sm text-gray-500">Collect at the branch</div>
                  </div>
                </div>
              </div>
            </label>

            <label className={`flex items-center space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50 ${
              deliveryInfo.method === 'delivery' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}>
              <input
                type="radio"
                checked={deliveryInfo.method === 'delivery'}
                onChange={() => setDeliveryInfo(prev => ({ ...prev, method: 'delivery' }))}
                className="w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <div>
                    <div className="font-medium">Delivery via Maxim</div>
                    <div className="text-sm text-gray-500">Home delivery</div>
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Delivery Form */}
        {deliveryInfo.method === 'delivery' && (
          <>
            {/* Saved Addresses */}
            {isAuthenticated && savedAddresses.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Save className="w-5 h-5 mr-2" />
                  Saved Addresses
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => selectSavedAddress(addr)}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        selectedLocation?.latitude === addr.latitude && selectedLocation?.longitude === addr.longitude
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-1">{addr.addressLabel}</div>
                          <div className="text-sm text-gray-600">{addr.addressLine1}</div>
                          {addr.landmark && (
                            <div className="text-xs text-gray-500 mt-1">Landmark: {addr.landmark}</div>
                          )}
                        </div>
                        {addr.isDefault && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Default</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          
            {/* Map Selection */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Delivery Location
                </h3>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isLoadingLocation}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {isLoadingLocation ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Navigation className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">Use My Location</span>
                    <span className="sm:hidden">My Location</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    {showMap ? 'Hide Map' : 'Show Map'}
                  </button>
                </div>
              </div>
              
              {mapError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-700">{mapError}</span>
                </div>
              )}
              
              {/* Map Container - ALWAYS RENDERED, just hidden with CSS */}
              <div className="mb-4" style={{ display: showMap ? 'block' : 'none' }}>
                <div 
                  ref={mapContainerRef}
                  className="w-full h-96 rounded-lg border border-gray-300 bg-gray-100"
                  style={{ 
                    minHeight: '384px',
                    backgroundColor: '#f3f4f6'
                  }}
                />
                <p className="text-sm text-gray-500 mt-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                  Click on the map or drag the marker to select your delivery location
                </p>
                {isGeocodingAddress && (
                  <p className="text-sm text-blue-600 mt-1 flex items-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    Getting address...
                  </p>
                )}
                {/* Debug info */}
                {showMap && (
                  <div className="text-xs text-gray-400 mt-2">
                    Debug: Leaflet loaded: {((window as any).L ? 'Yes' : 'No')}, 
                    Map instance: {mapInstanceRef.current ? 'Yes' : 'No'}, 
                    Container: {mapContainerRef.current ? 'Yes' : 'No'}
                  </div>
                )}
              </div>
              
              {selectedLocation && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-blue-900">Selected Location</p>
                      <p className="text-sm text-blue-700 mt-1 break-words">{selectedLocation.address}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Lat: {selectedLocation.latitude.toFixed(6)}, Lng: {selectedLocation.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Address *
                  </label>
                  <textarea
                    required
                    value={deliveryInfo.address || ''}
                    onChange={(e) => setDeliveryInfo(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter complete delivery address"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can edit the address above or select a location on the map
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={deliveryInfo.contactNumber || ''}
                      onChange={(e) => setDeliveryInfo(prev => ({ ...prev, contactNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+63 912 345 6789"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={deliveryInfo.landmark || ''}
                      onChange={(e) => setDeliveryInfo(prev => ({ ...prev, landmark: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Near SM Mall"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Delivery Information</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Delivery will be arranged through Maxim after order confirmation. 
                      Delivery fee will be calculated and confirmed by the store.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Items ({cart.itemCount})</span>
              <span className="font-medium">{formatPrice(cart.subtotal)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setCurrentStep('customer')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handleDeliverySubmit}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
          >
            <Truck className="w-4 h-4" />
            <span>Continue to Payment</span>
          </button>
        </div>
      </div>
    )
  }
  
  // Payment Step
  if (currentStep === 'payment') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Payment Method
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={paymentInfo.method === 'cash'}
                onChange={(e) => setPaymentInfo(prev => ({ ...prev, method: e.target.value }))}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">Cash on Pickup/Delivery</div>
                    <div className="text-sm text-gray-500">Pay when you receive your order</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Instructions (Optional)
            </label>
            <textarea
              value={paymentInfo.notes}
              onChange={(e) => setPaymentInfo(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any special instructions for your order..."
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Items ({cart.itemCount})</span>
              <span className="font-medium">{formatPrice(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium">{formatPrice(cart.tax)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setCurrentStep('delivery')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handlePaymentSubmit}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>Complete Order</span>
          </button>
        </div>
      </div>
    )
  }
  
  // Processing Step
  if (currentStep === 'processing') {
    return (
      <div className="p-6 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Processing...</h2>
        <p className="text-gray-600">Please wait while we process your order.</p>
      </div>
    )
  }
  
  // Confirmation Step
  if (currentStep === 'confirmation') {
    return (
      <div className="p-6 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Order Confirmed!</h2>
        <p className="text-gray-600">Your order has been successfully placed.</p>
      </div>
    )
  }
  
  // Default fallback
  return (
    <div className="p-6 text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2">Processing...</h2>
    </div>
  )
}

export default EnhancedCheckoutForm