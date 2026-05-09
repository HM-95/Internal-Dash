"use client"

import {
  ChevronRightIcon,
  Menu,
  X,
} from "lucide-react";
import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
// import { User } from '@supabase/supabase-js'; // DISABLED - Using internal auth

interface InternalUser {
  username: string;
  accessGroup: string;
  userId: string;
}

interface NavItem {
  iconSelected: string | null;
  iconUnselected: string | null;
  label: string;
  active: boolean;
  id: string;
  comingSoon?: boolean;
  beta?: boolean;
  disabled?: boolean;
  customIcon?: React.ReactNode;
}

interface DashboardSidebarProps {
  user: InternalUser;
  activeItem: string;
  onNavigate: (item: string) => void;
  onFeedbackClick: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

// Navigation menu items data
const getNavItems = (activeItem: string): NavItem[] => [
  {
    iconSelected: "/DiscoverIconSelected.svg",
    iconUnselected: "/DiscoverIconUnselected.svg",
    label: "Discover",
    active: activeItem === "Discover",
    id: "Discover",
  },
  {
    iconSelected: "/AISearchIconSelected.svg",
    iconUnselected: "/AISearchIconUnselected.svg",
    label: "AI Search",
    active: activeItem === "AI Search",
    id: "AI Search",
    beta: true,
  },
  {
    iconSelected: null,
    iconUnselected: null,
    label: "My Lists",
    active: activeItem === "My Lists",
    id: "My Lists",
    customIcon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-at-sign" aria-hidden="true">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"></path>
      </svg>
    ),
  },
  {
    iconSelected: "/TalentNetworkIcon.svg",
    iconUnselected: "/TalentNetworkIcon.svg",
    label: "Talent Network",
    active: activeItem === "Talent Network",
    id: "Talent Network",
  },
  {
    iconSelected: null,
    iconUnselected: "/OutreachIconUnusable.svg",
    label: "Outreach",
    active: activeItem === "Outreach",
    id: "Outreach",
    comingSoon: true,
    disabled: true,
  },
];

// Footer menu items data
const getFooterItems = (activeItem: string): NavItem[] => [
  {
    iconSelected: "/FeedbackIconSelected.svg",
    iconUnselected: "/FeedbackIconUnselected.svg",
    label: "Feedback",
    active: activeItem === "Feedback",
    id: "Feedback",
  },
  {
    iconSelected: "/SettingsIconSelected.svg",
    iconUnselected: "/SettingsIconUnselected.svg",
    label: "Settings",
    active: activeItem === "Settings",
    id: "Settings",
  },
];

export function DashboardSidebar({ user, activeItem, onNavigate, onFeedbackClick, isCollapsed, onToggleCollapse }: DashboardSidebarProps) {
  const router = useRouter();
  const navItems = getNavItems(activeItem);
  const footerItems = getFooterItems(activeItem);
  
  // State
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  
  // State to track if we're on mobile (client-side only)
  const [isClientMobile, setIsClientMobile] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  
  // Effect to set loading to false since user is passed as prop
  React.useEffect(() => {
    // User is already available from props, so we're not loading
  }, []);

  // Helper function to get user display name
  const getUserDisplayName = () => {
    if (!user) return 'User';
    
    // Use username for internal users
    return user.username || 'User';
  };

  // Helper function to get user avatar
  const getUserAvatar = () => {
    if (!user) return null;
    
    // Internal users don't have avatars, return null
    return null;
  };

  // Helper function to get user initials
  const getUserInitials = () => {
    if (!user) return 'U';
    
    const displayName = getUserDisplayName();
    if (displayName === 'User') {
      return user.username?.charAt(0)?.toUpperCase() || 'U';
    }
    
    return displayName.charAt(0).toUpperCase();
  };
  
  // Effect to handle client-side mobile detection
  React.useEffect(() => {
    const checkMobile = () => {
      setIsClientMobile(window.innerWidth < 768);
      // Close mobile menu when switching to desktop
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    
    // Check on mount
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Auto-collapse on mobile screens
  const shouldCollapse = isCollapsed || isClientMobile;

  const handleItemClick = (item: any) => {
    if (item.disabled) return;
    if (item.id === "Feedback") {
      onFeedbackClick();
    } else {
      onNavigate(item.id);
    }
    // Close mobile menu after navigation
    if (isClientMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };



  // Mobile top navigation bar
  if (isClientMobile) {
    return (
      <>
        {/* Mobile Top Navigation Bar */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#0f1419] border-b border-gray-800 px-4 py-0 flex items-center justify-between h-[60px]">
          <Image
            className="w-[120px] h-[28px] object-contain"
            alt="Haven Influence Logo"
            src="/haven-influence-vertical-logo.svg"
            width={120}
            height={28}
            priority
            loading="eager"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="w-10 h-10 p-2 text-white hover:bg-[#1a1f2e] active:bg-[#1a1f2e]"
          >
            {isMobileMenuOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
          </Button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={toggleMobileMenu}>
            <div 
              className="fixed top-[61px] left-0 right-0 bg-[#0f1419] border-b border-gray-800 max-h-[calc(100vh-61px)] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 space-y-4">
                {/* Navigation menu */}
                <nav className="space-y-2">
                  {navItems.map((item, index) => (
                    <Button
                      key={index}
                      variant={item.active ? "default" : "ghost"}
                      disabled={item.disabled}
                      onClick={() => handleItemClick(item)}
                      className={`w-full h-12 justify-start px-4 ${
                        item.active ? "bg-[#aec6ff] hover:bg-[#aec6ff]" : "hover:bg-[#1a1f2e]"
                      } ${item.disabled ? "cursor-not-allowed opacity-60" : ""} rounded-[10px] flex items-center gap-3 transition-all duration-200`}
                    >
                      {item.customIcon ? (
                        <div className={`${item.active ? 'text-[#0e121b]' : 'text-white'}`}>
                          {item.customIcon}
                        </div>
                      ) : item.iconUnselected ? (
                        <Image 
                          src={item.active && item.iconSelected ? item.iconSelected! : item.iconUnselected!} 
                          alt={item.label} 
                          width={item.label === "AI Search" ? 23 : 24} 
                          height={item.label === "AI Search" ? 23 : 24} 
                        />
                      ) : null}
                      <span
                        className={`font-medium text-base ${
                          item.active ? "text-[#0e121b]" : "text-white"
                        } ${item.comingSoon ? "text-[#606979]" : ""}`}
                      >
                        {item.label}
                      </span>
                      {item.comingSoon && (
                        <Badge
                          variant="outline"
                          className="ml-auto bg-[#1a1f2e] rounded-2xl"
                        >
                          <span className="text-gray-400 text-sm">Coming Soon</span>
                        </Badge>
                      )}
                      {item.beta && (
                        <Badge
                          variant="outline"
                          className="ml-auto bg-[#1a1f2e] rounded-2xl"
                        >
                          <span className="text-blue-400 text-xs font-medium">Beta</span>
                        </Badge>
                      )}
                    </Button>
                  ))}
                </nav>

                <Separator className="bg-gray-800" />

                {/* Footer menu */}
                <div className="space-y-2">
                  {footerItems.map((item, index) => (
                    <Button
                      key={index}
                      variant={item.active ? "default" : "ghost"}
                      onClick={() => handleItemClick(item)}
                      className={`w-full h-12 justify-start px-4 ${
                        item.active ? "bg-[#aec6ff] hover:bg-[#aec6ff]" : "hover:bg-[#1a1f2e]"
                      } rounded-[10px] flex items-center gap-3 transition-all duration-200`}
                    >
                      <Image 
                        src={item.active ? item.iconSelected! : item.iconUnselected!} 
                        alt={item.label} 
                        width={item.label === "Feedback" ? 23 : 24} 
                        height={item.label === "Feedback" ? 23 : 24} 
                      />
                      <span className={`font-medium text-base ${
                        item.active ? "text-[#0e121b]" : "text-white"
                      }`}>
                        {item.label}
                      </span>
                    </Button>
                  ))}
                </div>

                <Separator className="bg-gray-800" />

                {/* User profile section */}
                <div className={`bg-[#1a2232] rounded-[15px] transition-all duration-300 ease-in-out profile-card ${
                  shouldCollapse ? 'w-[40px] h-[40px] flex items-center justify-center' : ''
                }`}>
                  {shouldCollapse ? (
                    // Collapsed state: Only show avatar
                    <div className="cursor-pointer" onClick={toggleProfileMenu}>
                      <Avatar className="w-[30px] h-[30px] bg-[#d9d9d9] rounded-[999px]">
                        <AvatarFallback>
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  ) : (
                    // Expanded state: Full layout with name
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-3 cursor-pointer transition-colors duration-200" onClick={toggleProfileMenu}>
                        <Avatar className="w-[35px] h-[35px] bg-[#d9d9d9] rounded-[999px] flex-shrink-0">
                          <AvatarFallback>
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 pr-2 flex items-center">
                          <div className="font-medium text-gray-50 text-[17px] leading-tight break-words w-full">
                            {user ? getUserDisplayName() : 'Loading...'}
                          </div>
                        </div>
                        <div className={`transition-transform duration-200 flex-shrink-0 ${showProfileMenu ? 'rotate-180' : ''}`}>
                          <Image src="/ExpandButton.svg" alt="Profile Menu" width={20} height={20} className="filter brightness-0 invert" />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Profile Dropdown Menu - Only show in expanded state */}
                  {!shouldCollapse && (
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showProfileMenu ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="border-t border-gray-600 -mx-4">
                    <Button
                      variant="ghost"
                        onClick={handleLogout}
                        className="w-full h-12 justify-center px-4 hover:bg-[#1a1f2e] rounded-none flex items-center gap-3 transition-all duration-200 text-white hover:text-white focus:text-white active:text-white"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="font-medium text-base">Logout</span>
                    </Button>
                    </div>
                  </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop sidebar (existing code)
  return (
    <aside className="flex h-screen items-stretch pl-0 pr-0 py-0 relative bg-black overflow-hidden md:relative fixed md:translate-x-0 z-50">
      <div className={`flex flex-col items-start justify-between pt-4 pb-0 relative h-full bg-[#0f1419] rounded-[0px_12px_12px_0px] transition-all duration-300 ${
        shouldCollapse ? 'w-[60px] px-3' : 'w-[220px] px-3 md:w-[220px]'
      }`}>
        <div className={`flex flex-col items-start gap-5 relative flex-[0_0_auto] ${
          shouldCollapse ? 'w-[40px] items-center' : 'w-full'
        }`}>
          {/* Header with logo and collapse button */}
          <div className={`flex items-center pl-1 pr-0 py-0 relative flex-[0_0_auto] ${
            shouldCollapse ? 'w-[40px] justify-center pl-0 pr-0' : 'justify-between self-stretch w-full'
          }`}>
            {!shouldCollapse && (
              <div className="inline-flex items-center gap-[5px] relative flex-[0_0_auto]">
                <Image
                  className="relative w-[110px] h-[24px] object-contain"
                  alt="Haven Influence Logo"
                  src="/haven-influence-vertical-logo.svg"
                  width={110}
                  height={24}
                  priority
                  loading="eager"
                />
              </div>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={onToggleCollapse}
              className="w-8 h-8 p-1.5 bg-[#131922] rounded-md border border-solid border-gray-700 hover:bg-[#1f2632] hover:border-gray-600 active:bg-[#252c3a] transition-colors duration-200"
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className={`transition-transform duration-200 ${shouldCollapse ? 'rotate-180' : ''}`}
              >
                <path d="M10.8284 12.0007L15.7782 16.9504L14.364 18.3646L8 12.0007L14.364 5.63672L15.7782 7.05093L10.8284 12.0007Z" fill="#F9FAFB"/>
              </svg>
            </Button>
          </div>

          <Separator className={`bg-gray-800 ${shouldCollapse ? 'w-[40px]' : 'w-full'}`} />

          {/* Navigation menu */}
          <nav className={`flex flex-col items-start gap-2 relative flex-[0_0_auto] ${
            shouldCollapse ? 'w-[40px] items-center' : 'self-stretch w-full'
          }`}>
            {navItems.map((item, index) => (
              <Button
                key={index}
                variant={item.active ? "default" : "ghost"}
                disabled={item.disabled}
                onClick={() => handleItemClick(item)}
                className={`h-8 py-1.5 justify-center border ${
                  item.active ? "bg-[#1f242c] border-gray-700 hover:bg-[#1f242c]" : "border-transparent hover:bg-[#151b22]"
                } ${item.disabled ? "cursor-not-allowed opacity-60" : ""} rounded-lg flex items-center transition-all duration-200 ${
                  shouldCollapse ? 'w-8 px-1.5' : 'px-2.5 justify-start self-stretch w-full gap-2'
                }`}
              >
                {item.customIcon ? (
                  <div className={`${item.active ? 'text-white' : 'text-gray-200'}`}>
                    {item.customIcon}
                  </div>
                ) : item.iconUnselected ? (
                  <Image 
                    src={item.active && item.iconSelected ? item.iconSelected : item.iconUnselected} 
                    alt={item.label} 
                    width={18} 
                    height={18} 
                  />
                ) : null}
                {!shouldCollapse && <span
                  className={`font-medium text-[13px] tracking-[-0.1px] ${
                    item.active ? "text-white" : "text-gray-200"
                  } ${item.comingSoon ? "text-[#8b94a3]" : ""}`}
                >
                  {item.label}
                </span>}
                {item.comingSoon && (
                  !shouldCollapse && <span className="ml-auto px-1.5 py-0 text-[10px] text-gray-300 border border-gray-700 rounded-full">Coming Soon</span>
                )}
                {item.beta && (
                  !shouldCollapse && <span className="ml-auto px-1.5 py-0 text-[10px] text-blue-400 border border-blue-600 rounded-full font-medium">Beta</span>
                )}
              </Button>
            ))}
          </nav>
        </div>

        <div className={`flex flex-col items-center justify-center gap-1 relative ${
          shouldCollapse ? 'w-[40px]' : 'w-full'
        }`}>
          {/* Footer menu */}
          <div className={`flex flex-col items-start gap-2 relative flex-[0_0_auto] ${
            shouldCollapse ? 'w-[40px] items-center' : 'self-stretch w-full'
          }`} style={{ marginTop: '-8px', marginBottom: '2px' }}>
            {footerItems.map((item, index) => (
              <Button
                key={index}
                variant={item.active ? "default" : "ghost"}
                onClick={() => handleItemClick(item)}
                className={`h-8 py-1.5 justify-center border ${
                  item.active ? "bg-[#1f242c] border-gray-700 hover:bg-[#1f242c]" : "border-transparent hover:bg-[#151b22]"
                } rounded-lg flex items-center transition-all duration-200 ${
                  shouldCollapse ? 'w-8 px-1.5' : 'px-2.5 justify-start self-stretch w-full gap-2'
                }`}
              >
                {item.customIcon ? (
                  <div className={`${item.active ? 'text-white' : 'text-gray-200'}`}>
                    {item.customIcon}
                  </div>
                ) : (
                  <Image 
                    src={item.iconUnselected!} 
                    alt={item.label} 
                    width={18} 
                    height={18} 
                  />
                )}
                {!shouldCollapse && <span className={`font-medium text-[13px] tracking-[-0.1px] ${
                  item.active ? "text-white" : "text-gray-200"
                }`}>
                  {item.label}
                </span>}
              </Button>
            ))}
          </div>

          {/* User profile section */}
          <div className={`flex ${showProfileMenu ? 'min-h-[64px] items-start pt-2' : 'h-[64px] items-center'} relative ${
            shouldCollapse ? 'w-[40px] justify-center' : 'w-full justify-between'
          } pb-4`}>
            {shouldCollapse ? (
              <Avatar className="w-[24px] h-[24px] bg-[#d9d9d9] rounded-full">
                <AvatarFallback>
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-full">
                <div
                  onClick={() => setShowProfileMenu(v => !v)}
                  className={`w-full border text-white transition-colors cursor-pointer ${showProfileMenu ? 'bg-[#1a1f2e] border-gray-600' : 'bg-[#151b22] border-gray-700 hover:bg-[#1a1f2e]'}`}
                  style={{ borderRadius: 14, overflow: 'hidden', maxHeight: showProfileMenu ? 92 : 44, transition: 'max-height 200ms ease' }}
                >
                  <div className="flex items-center gap-2 px-3 py-2">
                    <span className="inline-flex items-center justify-center rounded-full overflow-hidden">
                      <Image src="/haven-influence-icon.svg" alt="Avatar" width={18} height={18} />
                    </span>
                    <span className="text-[13px] font-medium">{user ? getUserDisplayName() : 'Loading...'}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`ml-auto transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}>
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className={`px-3 pb-2 transition-opacity ${showProfileMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <button onClick={handleLogout} className="w-full text-[13px] px-3 py-1.5 rounded-md bg-[#0f1419] border border-gray-700 hover:bg-[#222838]">Logout</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}