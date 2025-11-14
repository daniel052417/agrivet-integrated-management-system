import React, { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useBranch } from '../../contexts/BranchContext'
import { supabase } from '../../services/supabase'
import LoadingSpinner from '../common/LoadingSpinner'

interface SmartRouterProps {
  children: React.ReactNode
}

const SmartRouter: React.FC<SmartRouterProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, isLoading } = useAuth()
  const { selectedBranch, availableBranches, selectBranch } = useBranch()
  const hasProcessedChangeParam = useRef(false)

  useEffect(() => {
    const handleSmartRouting = async () => {
      // Skip routing logic if still loading or on certain pages
      if (isLoading || location.pathname.startsWith('/auth/callback')) {
        return
      }

      console.log('🧭 SmartRouter: Evaluating routing...', {
        isAuthenticated,
        hasUser: !!user,
        hasSelectedBranch: !!selectedBranch,
        currentPath: location.pathname,
        preferredBranchId: user?.preferred_branch_id
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
            console.log('🎯 SmartRouter: Setting preferred branch:', preferredBranch.name)
            selectBranch(preferredBranch)
          }

          // Check if user explicitly wants to change branch (query parameter or sessionStorage flag)
          const searchParams = new URLSearchParams(location.search)
          const wantsToChangeBranch = searchParams.get('change') === 'true'
          const explicitBranchChange = sessionStorage.getItem('explicit-branch-change') === 'true'

          // If user explicitly wants to change branch, allow navigation
          if ((wantsToChangeBranch || explicitBranchChange) && location.pathname === '/branch-selection') {
            if (wantsToChangeBranch && !hasProcessedChangeParam.current) {
              console.log('✅ SmartRouter: Allowing explicit branch change navigation')
              hasProcessedChangeParam.current = true
              // Set sessionStorage flag to persist across URL changes
              sessionStorage.setItem('explicit-branch-change', 'true')
              // Remove the query parameter to clean up the URL
              navigate('/branch-selection', { replace: true })
            }
            return // Don't redirect, allow user to stay on branch-selection
          }

          // Clear the flag when user navigates away from branch-selection
          if (location.pathname !== '/branch-selection' && explicitBranchChange) {
            sessionStorage.removeItem('explicit-branch-change')
            hasProcessedChangeParam.current = false
          }

          // If we're on branch selection or auth selection, redirect to catalog
          // UNLESS user explicitly wants to change branch (handled above)
          if (location.pathname === '/branch-selection' || location.pathname === '/auth-selection') {
            console.log('🎯 SmartRouter: Redirecting to catalog with preferred branch')
            navigate('/catalog', { replace: true })
            return
          }
        } else {
          console.log('⚠️ SmartRouter: Preferred branch not found in available branches')
        }
      }

      // If user is authenticated but no preferred branch, and on auth-selection
      if (isAuthenticated && !user?.preferred_branch_id && location.pathname === '/auth-selection') {
        console.log('🎯 SmartRouter: Authenticated user without preferred branch, redirecting to catalog')
        navigate('/catalog', { replace: true })
        return
      }

      // If user is not authenticated and no branch selected, redirect to branch selection
      if (!isAuthenticated && !selectedBranch && location.pathname !== '/branch-selection') {
        console.log('🎯 SmartRouter: No auth and no branch, redirecting to branch selection')
        navigate('/branch-selection', { replace: true })
        return
      }

      // If user is not authenticated and on auth-selection without a branch
      if (!isAuthenticated && location.pathname === '/auth-selection' && !selectedBranch) {
        console.log('🎯 SmartRouter: No branch selected, redirecting to branch selection')
        navigate('/branch-selection', { replace: true })
        return
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
    isLoading
  ])

  // Show loading spinner while evaluating routing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="Loading..." />
      </div>
    )
  }

  return <>{children}</>
}

export default SmartRouter














