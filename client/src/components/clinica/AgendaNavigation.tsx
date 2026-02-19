
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";

interface AgendaNavigationProps {
  view: "week" | "day" | "agenda";
  setView: (view: "week" | "day" | "agenda") => void;
}

export const AgendaNavigation = ({ view, setView }: AgendaNavigationProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Ensure parent component gets notified when date changes
  useEffect(() => {
    // This would be where we'd dispatch an event or call a callback to update parent state
  }, [currentDate]);
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  
  const navigatePrevious = () => {
    setCurrentDate(prev => {
      if (view === "week") {
        return subDays(prev, 7);
      } else if (view === "agenda") {
        return subDays(prev, 3);
      }
      return subDays(prev, 1);
    });
  };

  const navigateNext = () => {
    setCurrentDate(prev => {
      if (view === "week") {
        return addDays(prev, 7);
      } else if (view === "agenda") {
        return addDays(prev, 3);
      }
      return addDays(prev, 1);
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDateRangeText = () => {
    if (view === "day") {
      return format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: es });
    } else if (view === "agenda") {
      const agendaEnd = addDays(currentDate, 2);
      return `${format(currentDate, "d", { locale: es })} — ${format(agendaEnd, "d 'de' MMMM 'de' yyyy", { locale: es })}`;
    } else {
      return `${format(weekStart, "d", { locale: es })} — ${format(weekEnd, "d 'de' MMMM 'de' yyyy", { locale: es })}`;
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={navigatePrevious} 
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Anterior</span>
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={navigateNext}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Siguiente</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={goToToday}
        >
          Hoy
        </Button>
        
        <h2 className="text-lg font-medium ml-2">
          {getDateRangeText()}
        </h2>
      </div>
      
      <div className="flex space-x-1 bg-muted rounded-md p-1">
        <Button 
          variant={view === "week" ? "default" : "ghost"}
          size="sm"
          onClick={() => setView("week")}
          className="text-xs h-8"
        >
          Semana
        </Button>
        <Button
          variant={view === "day" ? "default" : "ghost"}
          size="sm"
          onClick={() => setView("day")}
          className="text-xs h-8"
        >
          Día
        </Button>
        <Button
          variant={view === "agenda" ? "default" : "ghost"}
          size="sm"
          onClick={() => setView("agenda")}
          className="text-xs h-8"
        >
          Agenda
        </Button>
      </div>
    </div>
  );
};

