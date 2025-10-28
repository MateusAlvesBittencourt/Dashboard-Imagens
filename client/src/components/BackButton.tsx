import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useCallback } from "react";

type Props = {
  label?: string;
  fallbackPath?: string; // caso não haja histórico
  className?: string;
};

export default function BackButton({ label = "Voltar", fallbackPath = "/", className }: Props) {
  const [, setLocation] = useLocation();

  const onBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      setLocation(fallbackPath);
    }
  }, [fallbackPath, setLocation]);

  return (
    <Button variant="outline" size="sm" onClick={onBack} className={className}>
      <ChevronLeft size={16} className="mr-1" />
      {label}
    </Button>
  );
}
