
import { useState } from "react";
import { Calendar } from "lucide-react";
import MedicalSchedule from "../../components/clinica/MedicalSchedule";
import { AgendaNavigation } from "../../components/clinica/AgendaNavigation";

const AgendaMedicaPage = () => {
  const [view, setView] = useState<"week" | "day" | "agenda">("week");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center space-x-2">
          <Calendar className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Agenda Médica</h1>
        </div>
      </div>
      
      <div className="dashboard-card">
        <AgendaNavigation 
          view={view} 
          setView={setView} 
        />
        <MedicalSchedule 
          view={view} 
        />
      </div>
    </div>
  );
};

export default AgendaMedicaPage;

