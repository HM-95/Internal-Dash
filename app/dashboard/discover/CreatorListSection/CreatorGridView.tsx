import React from "react";
import { Creator } from "@/types/database";
import CreatorCard from "./CreatorCard";

interface CreatorGridViewProps {
  creators: Creator[];
  currentMode: 'ai' | 'all';
  selectedCards: Set<string>;
  handleCreatorClick: (creator: Creator) => void;
  handleCardSelection: (creatorId: string) => void;
  selectedCreator: Creator | null;
}

const CreatorGridView: React.FC<CreatorGridViewProps> = ({
  creators,
  currentMode,
  selectedCards,
  handleCreatorClick,
  handleCardSelection,
  selectedCreator,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-[12px] lg:gap-[15px] xl:gap-[18px] 2xl:gap-[20px] w-full pb-4">
    {creators.map((creator: Creator) => (
      <CreatorCard
        key={creator.id}
        creator={creator}
        currentMode={currentMode}
        selected={selectedCards.has(creator.id)}
        selectedCreator={selectedCreator}
        onClick={() => handleCreatorClick(creator)}
        onCheckboxChange={(checked: boolean) => {
          handleCardSelection(creator.id);
        }}
      />
    ))}
  </div>
);

export default CreatorGridView; 