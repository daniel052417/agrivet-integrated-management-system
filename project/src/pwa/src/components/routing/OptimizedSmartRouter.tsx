import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useOptimizedAuth } from '../../contexts/OptimizedAuthContext'
import { useOptimizedBranch } from '../../contexts/OptimizedBranchContext'
import LoadingSpinner from '../common/LoadingSpinner'

interface OptimizedSmartRouterProps {
  children: React.ReactNode
}

const OptimizedSmartRouter: React.FC<OptimizedSmartRouterProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { 
    user, 
    isAuthenticated, 
    isLoading: authLoading, 
    isInitializing: authInitializing 
  } = useOptimizedAuth()
  const { 
    selectedBranch, 
    availableBranches, 
    isInitializing: branchInitializing,
    selectBranch 
  } = useOptimizedBranch()

  const [isRouting, setIsRouting] = useState(false)

  // Determine if we should show loading
  const shouldShowLoading = authInitializing || branchInitializing || isRouting

  useEffect(() => {
    const handleSmartRouting = async () => {
      // Skip routing logic if still initializing or on certain pages
      if (authInitializing || branchInitializing || location.pathname.startsWith('/auth/callback')) {
        return
      }

      setIsRouting(true)

      try {
        console.log('🧭 OptimizedSmartRouter: Evaluating routing...', {
          isAuthenticated,
          hasUser: !!user,
          hasSelectedBranch: !!selectedBranch,
          currentPath: location.pathname,
          preferredBranchId: user?.preferred_branch_id,
          availableBranchesCount: availableBranches.length
        })

        // If user is authenticated and has a preferred branch
        if (isAuthenticated && user?.preferred_branch_id) {
          // Check if we have the preferred branch in our available branches
          const preferredBranch = availableBranches.find(
            branch => branch.id === user.preferred_branch_id
          )

          if (preferredBranch) {
            // If we don't have a selected branch or it's different from preferred
            if (!selectedBranch || selectedBranch.id !== user.preferred_branch_id) {
              console.log('🎯 OptimizedSmartRouter: Setting preferred branch:', preferredBranch.name)
              selectBranch(preferredBranch)
            }

            // If we're on branch selection or auth selection, redirect to catalog
            if (location.pathname === '/branch-selection' || location.pathname === '/auth-selection') {
              console.log('🎯 OptimizedSmartRouter: Redirecting to catalog with preferred branch')
              navigate('/catalog', { replace: true })
              return
            }
          } else {
            console.log('⚠️ OptimizedSmartRouter: Preferred branch not found in available branches')
          }
        }

        // If user is authenticated but no preferred branch, and on auth-selection
        if (isAuthenticated && !user?.preferred_branch_id && location.pathname === '/auth-selection') {
          console.log('🎯 OptimizedSmartRouter: Authenticated user without preferred branch, redirecting to catalog')
          navigate('/catalog', { replace: true })
          return
        }

        // If user is not authenticated and no branch selected, redirect to branch selection
        if (!isAuthenticated && !selectedBranch && location.pathname !== '/branch-selection') {
          console.log('🎯 OptimizedSmartRouter: No auth and no branch, redirecting to branch selection')
          navigate('/branch-selection', { replace: true })
          return
        }

        // If user is not authenticated and on auth-selection without a branch
        if (!isAuthenticated && location.pathname === '/auth-selection' && !selectedBranch) {
          console.log('🎯 OptimizedSmartRouter: No branch selected, redirecting to branch selection')
          navigate('/branch-selection', { replace: true })
          return
        }

      } catch (error) {
        console.error('❌ OptimizedSmartRouter: Error during routing:', error)
      } finally {
        setIsRouting(false)
      }
    }

    handleSmartRouting()
  }, [
    isAuthenticated,
    user,
    selectedBranch,
    availableBranches,
    location.pathname,
    navigate,
    selectBranch,
    authInitializing,
    branchInitializing
  ])

  // Show loading spinner while initializing or routing
  if (shouldShowLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner message="Loading..." />
          <div className="mt-4 text-sm text-gray-600">
            {authInitializing && "Initializing authentication..."}
            {branchInitializing && "Loading branches..."}
            {isRouting && "Routing..."}
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default OptimizedSmartRouter









