import { useNavigate } from "react-router-dom";

interface SuggestionCardProps {
  title: string;
  icon: string;
  route: string;
  description: string;
}

const SuggestionCard = ({ title, icon, route, description }: SuggestionCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Check if it's an external URL
    if (route.startsWith('http') || route.startsWith('tel:')) {
      window.open(route, '_blank', 'noopener,noreferrer');
    } else {
      navigate(route);
    }
  };

  return (
    <div 
      className="suggestion-card mb-2 flex items-center gap-3 cursor-pointer"
      onClick={handleClick}
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