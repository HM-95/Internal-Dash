import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, Plus, Upload } from "lucide-react";

// Import listsClient for fetching user lists
const getListsClient = async () => {
  const { listsClient } = await import('@/lib/listsClient');
  return listsClient;
};

interface MainContentSectionProps {
  onPromptSubmit?: (prompt: string) => void;
}

export const MainContentSection = ({ onPromptSubmit }: MainContentSectionProps): JSX.Element => {
  const router = useRouter();
  const [displayText, setDisplayText] = useState("Find me");
  const [isTyping, setIsTyping] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isInputActive, setIsInputActive] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [clickedCard, setClickedCard] = useState<number | null>(null);
  const [activatedCard, setActivatedCard] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("Search Buzzberry database");
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedListType, setSelectedListType] = useState<string>("database");
  const [animationTimeouts, setAnimationTimeouts] = useState<NodeJS.Timeout[]>([]);
  const [showAllLists, setShowAllLists] = useState(false);
  const [userLists, setUserLists] = useState<Array<{ id: string; name: string; creatorCount: number }>>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const prompts = [
    "meme coin influencers in Miami",
    "tech influencers in San Francisco",
    "fitness influencers in Los Angeles",
    "food bloggers in New York",
    "travel influencers in Austin"
  ];

  // Clear all timeouts when component unmounts or input becomes active
  const clearAllTimeouts = () => {
    animationTimeouts.forEach(timeout => clearTimeout(timeout));
    setAnimationTimeouts([]);
  };

  // Add timeout to tracking array
  const addTimeout = (timeout: NodeJS.Timeout) => {
    setAnimationTimeouts(prev => [...prev, timeout]);
    return timeout;
  };

  useEffect(() => {
    // Clear timeouts when input becomes active
    if (isInputActive) return;

    const currentPrompt = prompts[currentPromptIndex];
    let timeoutId: NodeJS.Timeout;

    if (!isTyping) {
      // Start typing after a pause
      timeoutId = addTimeout(setTimeout(() => {
        setIsTyping(true);
        typeText(currentPrompt, 0);
      }, 1000));
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentPromptIndex, isTyping, isInputActive]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);

  // Fetch user lists on component mount
  useEffect(() => {
    const fetchUserLists = async () => {
      try {
        setLoadingLists(true);
        const listsClient = await getListsClient();
        const lists = await listsClient.getLists();
        
        // Transform lists to include creator count
        const transformedLists = lists.map(list => ({
          id: list.id,
          name: list.name,
          creatorCount: list.creatorCount || 0
        }));
        
        setUserLists(transformedLists);
      } catch (error) {
        console.error('Failed to fetch user lists:', error);
        setUserLists([]); // Set empty array on error
      } finally {
        setLoadingLists(false);
      }
    };

    fetchUserLists();
  }, []);

  const typeText = (text: string, index: number) => {
    if (isInputActive) return; // Stop if input becomes active
    
    if (index <= text.length) {
      setDisplayText("Find me " + text.substring(0, index));
      const timeout = addTimeout(setTimeout(() => typeText(text, index + 1), 50));
    } else {
      // Finished typing, wait then start deleting
      const timeout = addTimeout(setTimeout(() => deleteText(text, text.length), 1500));
    }
  };

  const deleteText = (text: string, index: number) => {
    if (isInputActive) return; // Stop if input becomes active
    
    if (index >= 0) { // Delete back to just the additional text
      setDisplayText("Find me " + text.substring(0, index));
      const timeout = addTimeout(setTimeout(() => deleteText(text, index - 1), 25));
    } else {
      // Finished deleting, move to next prompt
      setIsTyping(false);
      setCurrentPromptIndex((prev) => (prev + 1) % prompts.length);
    }
  };

  const handleInputClick = () => {
    clearAllTimeouts(); // Stop all animations
    setIsInputActive(true);
    setDisplayText("");
    setIsTyping(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
  };

  const handleInputBlur = () => {
    if (userInput.trim() === "") {
      setIsInputActive(false);
      setDisplayText("Find me");
      setIsTyping(false);
      setCurrentPromptIndex(0); // Reset to first prompt
    }
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const prompt = isInputActive ? userInput.trim() : displayText;
    if (prompt && prompt !== "Find me") {
      // Navigate to chat page with the prompt and list context
      const encodedPrompt = encodeURIComponent(prompt);
      let url = `/dashboard/chat?prompt=${encodedPrompt}`;
      
      // Add list context if a specific list is selected
      if (selectedListType === "list" && selectedListId) {
        url += `&listId=${encodeURIComponent(selectedListId)}&listName=${encodeURIComponent(selectedOption)}`;
      }
      
      router.push(url);
    }
  };

  const handleSendClick = () => {
    const prompt = isInputActive ? userInput.trim() : displayText;
    if (prompt && prompt !== "Find me") {
      const encodedPrompt = encodeURIComponent(prompt);
      let url = `/dashboard/chat?prompt=${encodedPrompt}`;
      
      // Add list context if a specific list is selected
      if (selectedListType === "list" && selectedListId) {
        url += `&listId=${encodeURIComponent(selectedListId)}&listName=${encodeURIComponent(selectedOption)}`;
      }
      
      router.push(url);
    }
  };

  // Feature cards data
  const featureCards = [
    {
      title: "Search Influencers",
      description: "detailed performance data",
      icon: "/Search Icon Vector.svg",
      isComingSoon: false,
      width: "w-full md:w-[272px]",
      iconSize: "h-8 w-8",
      hasSocialIcons: true,
    },
    {
      title: "Analyze Audience",
      description: "directly target your ideal customer",
      icon: null,
      isComingSoon: true,
      width: "w-full md:w-[252px]",
      iconSize: "",
      hasSocialIcons: false,
    },
    {
      title: "Competitor Research",
      description: "analyze your rivals campaigns",
      icon: null,
      isComingSoon: true,
      width: "w-full md:w-[252px]",
      iconSize: "",
      hasSocialIcons: false,
    },
  ];

  // Social media icons data
  const socialIcons = [
    { src: "/X logo.svg", alt: "X (Twitter)", size: "h-6 w-6" },
    { src: "/Linkedin logo.svg", alt: "LinkedIn", size: "h-6 w-6" },
    { src: "/Youtube logo.svg", alt: "YouTube", size: "h-6 w-6" },
    { src: "/Instagram logo.svg", alt: "Instagram", size: "h-6 w-6" },
    { src: "/TikTok Logo.svg", alt: "TikTok", size: "h-6 w-6" },
  ];

  const handleCardClick = (index: number) => {
    if (index === 0) { // Search Influencers card
      setClickedCard(index);
      setActivatedCard(activatedCard === index ? null : index); // Toggle activation
      setTimeout(() => setClickedCard(null), 150);
    }
  };

  // Dynamic dropdown options that include user's real lists
  const dropdownOptions = React.useMemo(() => {
    const options = [
      { id: "database", label: "Search Buzzberry database", type: "database", count: 127543 },
      { id: "divider", label: "", type: "divider" }
    ];

    // Add user lists
    if (loadingLists) {
      options.push({ id: "loading", label: "Loading lists...", type: "loading", count: 0 });
    } else {
      userLists.forEach(list => {
        options.push({
          id: list.id,
          label: list.name,
          type: "list",
          count: list.creatorCount
        });
      });
    }

    // Add action items
    options.push(
      { id: "add", label: "Add new list", type: "add" },
      { id: "import", label: "Import influencers", type: "import" }
    );

    return options;
  }, [userLists, loadingLists]);

  const handleDropdownSelect = (option: typeof dropdownOptions[0]) => {
    if (option.type === "add") {
      // Navigate to list page and trigger add list popup
      setIsDropdownOpen(false);
      router.push('/dashboard/mylists?addList=true');
      return;
    }
    if (option.type === "import") {
      // Navigate to list page and trigger import creators modal
      setIsDropdownOpen(false);
      router.push('/dashboard/mylists?importCreators=true');
      return;
    }
    if (option.type === "showMore") {
      setShowAllLists(!showAllLists);
      return;
    }
    if (option.type !== "divider") {
      setSelectedOption(option.label);
      setSelectedListType(option.type);
      setSelectedListId(option.type === "list" ? option.id : null);
      setIsDropdownOpen(false);
      
      // Add visual feedback for selection
      console.log(`Selected: ${option.label}`, { type: option.type, id: option.id });
      
      // If it's a database search, we could add some visual indication
      if (option.type === "database") {
        console.log("Searching full Buzzberry database");
      }
      
      // If it's a list, we could load that list's data
      if (option.type === "list") {
        console.log(`Loading list: ${option.label} with ${option.count} influencers`);
      }
    }
  };

  return (
    <section className="flex flex-col w-full max-w-[820px] items-center gap-8 sm:gap-10 md:gap-10 lg:gap-12 mx-auto py-6 sm:py-6 md:py-6 lg:py-8 px-4">
      {/* Welcome Section */}
      <div className="flex flex-col items-center gap-3 sm:gap-[3px] w-full max-w-xs sm:max-w-sm md:max-w-none">
        <div className="flex flex-col w-full max-w-[180px] sm:max-w-[228px] items-start gap-2.5">
          <video
            className="w-full h-[90px] sm:h-[90px] md:h-[110px] lg:h-[130px] object-cover rounded-lg"
            style={{ 
              imageRendering: 'auto',
              WebkitBackfaceVisibility: 'hidden',
              WebkitPerspective: 1000,
              WebkitTransform: 'translate3d(0,0,0)',
              transform: 'translate3d(0,0,0)',
              filter: 'contrast(1.1) saturate(1.05)',
              WebkitFilter: 'contrast(1.1) saturate(1.05)'
            }}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          >
            <source 
              src="https://epwm2xeeqm8soa6z.public.blob.vercel-storage.com/Buzzberry%20AI%20Chat.webm" 
              type="video/webm" 
            />
            Your browser does not support the video tag.
          </video>
        </div>

        <div className="flex flex-col items-start gap-3 sm:gap-2.5 p-2 sm:p-2.5 w-full">
          <div className="flex flex-col w-full max-w-[780px] items-start gap-2 sm:gap-2 mx-auto px-2 sm:px-4 md:px-0">
            <h1 className="w-full mt-[-1.00px] font-['Plus_Jakarta_Sans',Helvetica] font-medium text-white text-[28px] sm:text-[34px] md:text-[40px] text-center tracking-[-0.40px] leading-[32px] sm:leading-[40px] md:leading-[48px]">
              Welcome to Haven Influence
            </h1>

            <p className="w-full font-['Plus_Jakarta_Sans',Helvetica] font-normal text-white text-xs xs:text-sm sm:text-base md:text-lg text-center tracking-[-0.30px] leading-[16px] xs:leading-[20px] sm:leading-[24px] md:leading-[26px] px-2 sm:px-0">
              Enter the type of influencers you&apos;re looking for.
              <br />
              See top matches based on audience and relevance.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Cards and Search Section */}
      <div className="flex flex-col w-full max-w-[804px] items-center gap-6 sm:gap-6 md:gap-8 lg:gap-10">
        {/* Feature Cards */}
        <div className="flex flex-row flex-wrap items-center justify-center gap-3 xs:gap-2 sm:gap-3 w-full px-2 sm:px-0">
          {featureCards.map((card, index) => (
            <Card
              key={`feature-card-${index}`}
              className={`w-[180px] sm:w-[200px] md:w-[220px] lg:w-[240px] bg-[#0f1419] border-[#2c3954] rounded-xl transition-all duration-200 cursor-pointer ${
                card.isComingSoon 
                  ? 'opacity-60 hover:opacity-70' 
                  : 'hover:bg-[#1a1f2e] hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20'
              } ${
                clickedCard === index ? 'scale-[0.96] bg-[#1a1f2e] shadow-xl shadow-blue-500/30 ring-2 ring-blue-500/20' : ''
              } ${
                activatedCard === index ? 'bg-[#1a1f2e] shadow-lg shadow-blue-500/25 ring-2 ring-blue-500/30' : ''
              }`}
              onClick={() => handleCardClick(index)}
            >
              <CardContent className="flex flex-col h-[80px] xs:h-[90px] sm:h-[100px] md:h-[120px] items-start pt-2 pb-3 sm:pb-4 px-2 sm:px-3">
                {card.hasSocialIcons ? (
                  <div className="flex items-center gap-2 xs:gap-1.5 sm:gap-2 md:gap-3 mb-2 sm:mb-2">
                    <img 
                      className={`${card.iconSize} object-contain`}
                      alt={card.title} 
                      src={card.icon || ''}
                    />
                    <div className="flex items-center overflow-hidden">
                      {socialIcons.map((socialIcon, socialIndex) => (
                        <div
                          key={`social-icon-${socialIndex}`}
                          className={`flex items-center justify-center w-4 xs:w-5 sm:w-6 md:w-7 h-4 xs:h-5 sm:h-6 md:h-7 rounded-full bg-[#2c3954] hover:bg-[#3a4660] transition-colors ${
                            socialIndex > 0 ? '-ml-0.5 xs:-ml-0.5 sm:-ml-1 md:-ml-1.5' : ''
                          }`}
                        >
                          <img
                            className="h-3 xs:h-4 sm:h-5 md:h-7 w-3 xs:w-4 sm:w-5 md:w-7 object-contain"
                            alt={socialIcon.alt}
                            src={socialIcon.src}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  card.icon ? (
                    <img 
                      className={`${card.iconSize} object-contain`}
                      alt={card.title} 
                      src={card.icon as string}
                    />
                  ) : null
                )}

                {card.isComingSoon && (
                  <Badge
                    variant="outline"
                    className="bg-[#1a1f2e] text-gray-400 rounded-2xl mt-2 sm:mt-3 text-xs"
                  >
                    Coming Soon
                  </Badge>
                )}

                <div className="flex flex-col items-start justify-center gap-1 w-full mt-auto">
                  <h3 className="font-['Plus_Jakarta_Sans',Helvetica] font-medium text-white text-xs xs:text-sm sm:text-base md:text-lg tracking-[-0.27px] leading-[16px] xs:leading-[20px] sm:leading-[24px] md:leading-[27px] whitespace-nowrap">
                    {card.title}
                  </h3>
                  <p className="font-['Plus_Jakarta_Sans',Helvetica] font-normal text-[#99a0ad] text-[10px] xs:text-xs tracking-[-0.08px] leading-[14px] xs:leading-[16px] sm:leading-[18px] md:leading-[21px]">
                    {card.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search Input */}
        <div className="w-full max-w-[776px] px-2 sm:px-0">
          <div className="border border-solid border-gray-700 rounded-xl bg-[#0f1419] focus-within:border-gray-600 transition-colors">
            <div className="flex flex-col p-0">
              <form onSubmit={handlePromptSubmit} className="focus:outline-none">
                <div className="flex flex-wrap items-start gap-4 sm:gap-[36px_1px] px-2.5 py-3.5 w-full">
                  <div className="flex items-center justify-start gap-2.5 w-full">
                    {isInputActive ? (
                      <input
                        type="text"
                        value={userInput}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                       onKeyDown={(e) => {
                         if (e.key === 'Enter') {
                           e.preventDefault();
                           e.stopPropagation();
                           handleSendClick();
                         }
                       }}
                        autoFocus
                        className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none focus:shadow-none font-['Plus_Jakarta_Sans',Helvetica] font-light text-white text-sm sm:text-base tracking-[-0.18px] leading-5 sm:leading-6 w-full flex-1 resize-none placeholder:text-sm placeholder:sm:text-base"
                        placeholder="Find me..."
                      />
                    ) : (
                      <span 
                        className="font-['Plus_Jakarta_Sans',Helvetica] font-light text-white text-sm sm:text-base tracking-[-0.18px] leading-5 sm:leading-6 cursor-text flex-1 whitespace-normal break-words"
                        onClick={handleInputClick}
                      >
                        {displayText}
                        <span className="animate-pulse">|</span>
                      </span>
                    )}
                  </div>

                  <div className="flex w-full h-6 items-center justify-between mt-2">
                    <div className="inline-flex flex-col items-start flex-shrink-0">
                      <div className="relative">
                        <div className="flex h-6 items-center overflow-hidden">
                                                    <div
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsDropdownOpen(!isDropdownOpen);
                            }}
                            onKeyDown={(e) => {
                             if (e.key === 'Enter') {
                               e.preventDefault();
                               e.stopPropagation();
                             }
                           }}
                            className="h-5 bg-[#0f1419] rounded-[100px] text-[#dfdfdf] text-xs font-['Plus_Jakarta_Sans',Helvetica] px-2 py-1 flex items-center gap-2 search-database-selector cursor-pointer"
                          >
                            <span className="truncate max-w-[120px] xs:max-w-[150px] sm:max-w-none">{selectedOption}</span>
                            <ChevronDown className={`h-3 w-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </div>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                          <div className="absolute bottom-full left-0 mb-1 w-56 xs:w-64 bg-[#0f1419] border-[1px] border-[#374151] rounded-xl shadow-lg z-50">
                            <div className="py-2">
                              {dropdownOptions.map((option, index) => {
                                // Filter logic for lists
                                if (option.type === "list") {
                                  const listOptions = dropdownOptions.filter(opt => opt.type === "list");
                                  const listIndex = listOptions.findIndex(opt => opt.id === option.id);
                                  
                                  // Show only first 3 lists if not expanded
                                  if (!showAllLists && listIndex >= 3) {
                                    return null;
                                  }
                                }
                                
                                if (option.type === "divider") {
                                  return (
                                    <div key={option.id} className="h-px bg-[#2c3954] mx-2 my-1" />
                                  );
                                }
                                
                                if (option.type === "loading") {
                                  return (
                                    <div key={option.id} className="w-full px-3 py-2 flex items-center gap-2 text-[#99a0ad] text-xs font-['Plus_Jakarta_Sans',Helvetica]">
                                      <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                      <span>{option.label}</span>
                                    </div>
                                  );
                                }
                                
                                // Show "Show more" button after 3rd list if there are more than 3 lists
                                const listOptions = dropdownOptions.filter(opt => opt.type === "list");
                                const isThirdList = option.type === "list" && listOptions.findIndex(opt => opt.id === option.id) === 2;
                                const hasMoreLists = listOptions.length > 3;
                                
                                if (option.type === "add") {
                                  return (
                                    <div key={option.id}>
                                      {/* Show "Show more" button before Add new list if needed */}
                                      {hasMoreLists && !showAllLists && (
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setShowAllLists(true);
                                          }}
                                          className="w-full px-3 py-2 text-left hover:bg-[#1a1f2e] flex items-center gap-2 text-[#99a0ad] text-xs font-['Plus_Jakarta_Sans',Helvetica]"
                                        >
                                          <ChevronDown className="h-3 w-3" />
                                          <span>Show {listOptions.length - 3} more lists</span>
                                        </button>
                                      )}
                                      {/* Show "Show less" button if expanded */}
                                      {hasMoreLists && showAllLists && (
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setShowAllLists(false);
                                          }}
                                          className="w-full px-3 py-2 text-left hover:bg-[#1a1f2e] flex items-center gap-2 text-[#99a0ad] text-xs font-['Plus_Jakarta_Sans',Helvetica]"
                                        >
                                          <ChevronDown className="h-3 w-3 rotate-180" />
                                          <span>Show less</span>
                                        </button>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleDropdownSelect(option);
                                        }}
                                        className="w-full px-3 py-2 text-left hover:bg-[#1a1f2e] flex items-center gap-2 text-[#99a0ad] text-xs font-['Plus_Jakarta_Sans',Helvetica]"
                                      >
                                        <Plus className="h-3 w-3" />
                                        <span>{option.label}</span>
                                      </button>
                                    </div>
                                  );
                                }
                                
                                if (option.type === "import") {
                                  return (
                                    <button
                                      key={option.id}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDropdownSelect(option);
                                      }}
                                      className="w-full px-3 py-2 text-left hover:bg-[#1a1f2e] flex items-center gap-2 text-[#99a0ad] text-xs font-['Plus_Jakarta_Sans',Helvetica]"
                                    >
                                      <Upload className="h-3 w-3" />
                                      <span>{option.label}</span>
                                    </button>
                                  );
                                }
                                
                                return (
                                  <button
                                    key={option.id}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDropdownSelect(option);
                                    }}
                                    className={`w-full px-3 py-2 text-left hover:bg-[#1a1f2e] text-xs font-['Plus_Jakarta_Sans',Helvetica] ${
                                      selectedOption === option.label 
                                        ? 'text-white bg-[#1a1f2e]' 
                                        : option.type === 'list' || option.type === 'database'
                                          ? 'text-[#99a0ad]' 
                                          : 'text-[#dfdfdf]'
                                    }`}
                                  >
                                    <div className="truncate">{option.label}</div>
                                    {(option.type === 'list' || option.type === 'database') && (
                                      <div className="text-[10px] text-[#6b7280] mt-0.5">
                                        {option.type === 'database' ? 'Full database' : 'Private list'} • {option.count} influencers
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button 
                      type="button"
                     variant="ghost"
                      size="icon" 
                     className="p-0 hover:bg-transparent focus:bg-transparent hover:shadow-lg hover:shadow-black/30 transition-shadow duration-200"
                      onClick={handleSendClick}
                     style={{
                       filter: 'drop-shadow(0 0 0 transparent)',
                       transition: 'filter 0.2s ease'
                     }}
                     onMouseEnter={(e) => {
                       e.currentTarget.style.filter = 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))';
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.filter = 'drop-shadow(0 0 0 transparent)';
                     }}
                    >
                      <img
                        className="h-6 w-6 transition-transform duration-200 hover:scale-110"
                        alt="Send prompt button"
                       src="/Send Prompt Button.png"
                      />
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </section>
  );
};