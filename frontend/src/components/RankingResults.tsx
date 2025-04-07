
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface RankingResult {
  filename: string;
  score: number;
  reasoning: string;
}

interface RankingResultsProps {
  results: RankingResult[];
}

export const RankingResults = ({ results }: RankingResultsProps) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (filename: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [filename]: !prev[filename],
    }));
  };

  // Sort results by score in descending order
  const sortedResults = [...results].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-3">
      {sortedResults.map((result) => {
        const isExpanded = !!expandedItems[result.filename];
        
        return (
          <Card key={result.filename} className="overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
                  result.score >= 7 ? "bg-green-500" : 
                  result.score >= 4 ? "bg-yellow-500" : "bg-red-500"
                )}>
                  {result.score}
                </div>
                <div>
                  <h3 className="font-medium">{result.filename}</h3>
                  <p className="text-sm text-gray-500">
                    Match score: {result.score}/10
                  </p>
                </div>
              </div>
              <button 
                onClick={() => toggleItem(result.filename)}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                View reasoning
                {isExpanded ? 
                  <ChevronUp className="ml-1 h-4 w-4" /> : 
                  <ChevronDown className="ml-1 h-4 w-4" />
                }
              </button>
            </div>
            
            {isExpanded && (
              <div className="px-4 pb-4 pt-0 border-t bg-gray-50">
                <div className="p-3 bg-white rounded border mt-2">
                  <h4 className="font-medium text-sm mb-1">Reasoning:</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{result.reasoning}</p>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};
