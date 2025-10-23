import React, { useState, useEffect, useRef } from 'react'
import { CreditCard, User, MapPin, Phone, Mail, AlertCircle, CheckCircle, Clock, Truck, Package, Home, Navigation, Search, Save, Loader2 } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useBranch } from '../../contexts/BranchContext'
import { useAuth } from '../../contexts/AuthContext'
import OrderService from '../../services/orderService'
import GcashQR from '../../assets/gcash-qr.jpg'
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
  const [gcashReference, setGcashReference] = useState('')
  const [isVerifyingReference, setIsVerifyingReference] = useState(false)
  const [referenceError, setReferenceError] = useState<string | null>(null)
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null)

  // Customer Info
  const [customerInfo, setCustomerInfo] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: ''
  })

  const validateGCashReference = (reference: string): boolean => {
  // GCash reference numbers are typically 13 digits
  const gcashPattern = /^\d{13}$/
  return gcashPattern.test(reference.trim())
}
const handleGCashReferenceChange = (value: string) => {
  setGcashReference(value)
  setReferenceError(null)
  
  // Real-time validation
  if (value.length > 0 && value.length < 13) {
    setReferenceError('Reference number must be 13 digits')
  } else if (value.length === 13 && !validateGCashReference(value)) {
    setReferenceError('Invalid reference number format')
  }
}
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
  const handlePaymentProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setReferenceError('Please upload an image file')
      return
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setReferenceError('Image size must be less than 5MB')
      return
    }
    
    setPaymentProof(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPaymentProofPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }
}
  const handlePaymentSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // Validate GCash reference
  if (!gcashReference.trim()) {
    onError('Please enter your GCash reference number')
    setReferenceError('Reference number is required')
    return
  }
  
  if (!validateGCashReference(gcashReference)) {
    onError('Please enter a valid 13-digit GCash reference number')
    setReferenceError('Invalid reference number format')
    return
  }
  
  // Optional: Require payment proof screenshot
  if (!paymentProof) {
    const confirmWithoutProof = window.confirm(
      'No payment screenshot uploaded. Are you sure you want to continue without proof of payment?'
    )
    if (!confirmWithoutProof) return
  }
  
  setCurrentStep('processing')
  processOrder()
}

  const processOrder = async () => {
  if (!selectedBranch) {
    onError('No branch selected')
    setCurrentStep('payment')
    setIsProcessing(false)
    return
  }

  console.log('🚀 Starting order processing...')
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
      }
    }

    console.log('🔄 Calling orderService.createOrder with GCash reference...')
    const result = await orderService.createOrder({
      cart,
      customerId: customerId,
      branchId: selectedBranch.id,
      paymentMethod: 'gcash', // Changed from 'cash' to 'gcash'
      paymentReference: gcashReference.trim(), // Add reference
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
      
      // If payment proof was uploaded, you can upload it to storage here
      if (paymentProof && result.orderId) {
        try {
          const { supabase } = await import('../../services/supabase')
          const fileName = `${result.orderId}_${Date.now()}.${paymentProof.name.split('.').pop()}`
          
          const { error: uploadError } = await supabase.storage
            .from('payment-proofs')
            .upload(fileName, paymentProof)
          
          if (!uploadError) {
            console.log('✅ Payment proof uploaded successfully')
          }
        } catch (uploadError) {
          console.error('⚠️ Failed to upload payment proof:', uploadError)
          // Non-critical, continue
        }
      }
      
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
    <div className="space-y-4 sm:space-y-6">
      {/* GCash Payment Section */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Payment via GCash
        </h3>
        
        {/* GCash Info Alert */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-blue-900">GCash Payment Instructions</p>
              <p className="text-xs sm:text-sm text-blue-700 mt-1">
                Scan the QR code below or send payment to the account provided. 
                Enter your 13-digit reference number after payment.
              </p>
            </div>
          </div>
        </div>

        {/* GCash QR Code and Account Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* QR Code */}
          <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-4 sm:p-6 border-2 border-dashed border-gray-300">
            <div className="w-48 h-48 sm:w-64 sm:h-64 bg-white rounded-lg shadow-md flex items-center justify-center mb-3 sm:mb-4 overflow-hidden">
              <img 
                src={GcashQR} 
                alt="GCash QR Code" 
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  // Fallback if image doesn't load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="text-center p-4"><div class="w-16 h-16 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center"><svg class="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"></path></svg></div><p class="text-sm text-gray-600">QR Code</p></div>';
                  }
                }}
              />
            </div>
            <p className="text-xs sm:text-sm text-gray-600 text-center">
              Scan with GCash app to pay
            </p>
          </div>

          {/* Account Details */}
          <div className="flex flex-col justify-center space-y-3 sm:space-y-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 sm:p-6 text-white shadow-lg">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm opacity-90">Pay to</p>
                  <p className="font-bold text-sm sm:text-base">GCash Account</p>
                </div>
              </div>
              
              <div className="space-y-2 sm:space-y-3 bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                <div>
                  <p className="text-xs opacity-75 mb-0.5">Account Name</p>
                  <p className="font-semibold text-sm sm:text-base">DA***l JO*N P.</p>
                </div>
                <div>
                  <p className="text-xs opacity-75 mb-0.5">Mobile Number</p>
                  <p className="font-semibold text-sm sm:text-base tracking-wider">0962 754 ****</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-yellow-800">
  <span className="font-semibold">
    Amount to pay: {formatPrice(cart.total)}
  </span>
  <br />
  Make sure to send the exact amount for your items only.
  <br />
  <span className="italic text-yellow-700">
    * Delivery fee will be added after booking via Maxim and must be shouldered by the customer. *
  </span>
</p>

              </div>
            </div>
          </div>
        </div>

        {/* Reference Number Input */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GCash Reference Number *
          </label>
          <div className="relative">
            <input
              type="text"
              required
              maxLength={13}
              value={gcashReference}
              onChange={(e) => handleGCashReferenceChange(e.target.value)}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-lg text-sm sm:text-base focus:outline-none transition-colors ${
                referenceError 
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                  : gcashReference.length === 13 && !referenceError
                  ? 'border-green-500 focus:ring-2 focus:ring-green-500'
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
              }`}
              placeholder="Enter 13-digit reference number"
            />
            {gcashReference.length === 13 && !referenceError && (
              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
            )}
          </div>
          
          {referenceError && (
            <p className="mt-1.5 text-xs sm:text-sm text-red-600 flex items-center">
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
              {referenceError}
            </p>
          )}
          
          <p className="mt-1.5 text-xs text-gray-500">
            Find this in your GCash transaction receipt (13 digits)
          </p>
          
          {gcashReference && (
            <p className="mt-1 text-xs text-gray-600">
              Length: {gcashReference.length}/13 digits
            </p>
          )}
        </div>

        {/* Payment Proof Upload (Optional) */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Screenshot (Recommended)
          </label>
          
          {!paymentProofPreview ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handlePaymentProofUpload}
                className="hidden"
                id="payment-proof-upload"
              />
              <label 
                htmlFor="payment-proof-upload" 
                className="cursor-pointer flex flex-col items-center"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                  <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">Upload Payment Screenshot</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB (Optional)</p>
              </label>
            </div>
          ) : (
            <div className="relative border-2 border-green-500 rounded-lg p-3 sm:p-4 bg-green-50">
              <button
                type="button"
                onClick={() => {
                  setPaymentProof(null)
                  setPaymentProofPreview(null)
                }}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <div className="flex items-center space-x-3">
                <img 
                  src={paymentProofPreview} 
                  alt="Payment proof" 
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-900 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
                    Screenshot uploaded
                  </p>
                  <p className="text-xs text-green-700 mt-0.5 truncate">
                    {paymentProof?.name}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Special Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Instructions (Optional)
          </label>
          <textarea
            value={paymentInfo.notes}
            onChange={(e) => setPaymentInfo(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Any special instructions for your order..."
          />
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Order Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Items ({cart.itemCount})</span>
            <span className="font-medium">{formatPrice(cart.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax (12%)</span>
            <span className="font-medium">{formatPrice(cart.tax)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between font-bold text-base sm:text-lg">
              <span>Total to Pay</span>
              <span className="text-blue-600">{formatPrice(cart.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4">
        <button
          type="button"
          onClick={() => setCurrentStep('delivery')}
          className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm sm:text-base transition-colors"
        >
          Back
        </button>
        <button
          onClick={handlePaymentSubmit}
          disabled={!gcashReference || !!referenceError || gcashReference.length !== 13}
          className="w-full sm:flex-1 bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium text-sm sm:text-base transition-colors shadow-lg disabled:shadow-none"
        >
          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Complete Order</span>
        </button>
      </div>

      {/* Payment Verification Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
        <div className="flex items-start space-x-2">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-amber-900">Payment Verification</p>
            <p className="text-xs sm:text-sm text-amber-700 mt-1">
              Your order will be confirmed after we verify your GCash payment. 
              This usually takes 5-15 minutes during business hours.
            </p>
          </div>
        </div>
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