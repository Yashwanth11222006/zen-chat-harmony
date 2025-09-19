import { useNavigate } from "react-router-dom";

interface SuggestionCardProps {
  title: string;
  icon: string;
  route: string;
  description: string;
}

const SuggestionCard = ({ title, icon, route, description }: SuggestionCardProps) => {
  const navigate = useNavigate();

  return (
    <div 
      className="suggestion-card mb-2 flex items-center gap-3"
      onClick={() => navigate(route)}
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <h4 className="font-medium text-zen-deep">{title}</h4>
        <p className="text-sm text-zen-olive">{description}</p>
      </div>
    </div>
  );
};

export default SuggestionCard;