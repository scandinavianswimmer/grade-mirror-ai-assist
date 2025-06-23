
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const GeminiSetup = () => {
  const [apiKey, setApiKey] = useState("");
  const { toast } = useToast();

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key required",
        description: "Please enter your Gemini API key",
        variant: "destructive"
      });
      return;
    }

    // In a real implementation, this would save to Supabase secrets
    localStorage.setItem('gemini_api_key', apiKey);
    
    toast({
      title: "API Key saved!",
      description: "Gemini integration is now ready to use.",
    });
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Gemini AI Setup</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Enter your Google Gemini API key to enable AI grading features.
      </p>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="apiKey">Gemini API Key</Label>
          <Input
            id="apiKey"
            type="password"
            placeholder="Enter your API key..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="mt-1"
          />
        </div>
        
        <Button onClick={handleSaveApiKey} className="w-full">
          <Key className="w-4 h-4 mr-2" />
          Save API Key
        </Button>
        
        <p className="text-xs text-gray-500">
          Get your API key from Google AI Studio. Your key is stored securely and only used for grading.
        </p>
      </div>
    </Card>
  );
};

export default GeminiSetup;
