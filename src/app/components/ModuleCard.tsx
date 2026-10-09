import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

interface SubModule {
  name: string;
  description: string;
}

interface ModuleCardProps {
  title: string;
  formerName: string;
  description: string;
  icon: LucideIcon;
  subModules: SubModule[];
  color: string;
  badge?: string;
  onClick: () => void;
}

export function ModuleCard({ 
  title, 
  formerName, 
  description, 
  icon: Icon, 
  subModules, 
  color,
  badge,
  onClick 
}: ModuleCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-blue-300 group"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between mb-3">
          <div 
            className={`p-3 rounded-lg ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}
          >
            <Icon className={`size-6 ${color.replace('bg-', 'text-')}`} />
          </div>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg mb-1">{title}</CardTitle>
        <CardDescription className="text-xs italic text-gray-500">
          {formerName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Features:</p>
          <ul className="space-y-1.5">
            {subModules.map((subModule, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <div>
                  <span className="font-medium">{subModule.name}</span>
                  {subModule.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{subModule.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
