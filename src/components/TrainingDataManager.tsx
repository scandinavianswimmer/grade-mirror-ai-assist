import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, MoreVertical, Trash2, Edit2, Calendar, File } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { getTrainingData, deleteTrainingData, updateTrainingData } from '@/lib/api';
import { TrainingData } from '@/lib/supabase';

const TrainingDataManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; item: TrainingData | null }>({ 
    open: false, 
    item: null 
  });
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (user) {
      fetchTrainingData();
    }
  }, [user]);

  const fetchTrainingData = async () => {
    if (!user) return;
    
    try {
      const data = await getTrainingData(user.id);
      setTrainingData(data as TrainingData[]);
    } catch (error) {
      console.error('Error fetching training data:', error);
      toast({
        title: "Error loading training data",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, dataType: string) => {
    try {
      await deleteTrainingData(id);
      toast({
        title: "Training data deleted",
        description: `${dataType} has been deleted successfully.`
      });
      fetchTrainingData(); // Refresh the list
    } catch (error) {
      console.error('Error deleting training data:', error);
      toast({
        title: "Error deleting training data",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRename = async () => {
    if (!renameDialog.item || !newName.trim()) return;

    try {
      await updateTrainingData(renameDialog.item.id, { 
        data_type: newName.trim() as "feedback" | "rubric" | "assignment"
      });
      toast({
        title: "Training data renamed",
        description: "Name updated successfully."
      });
      setRenameDialog({ open: false, item: null });
      setNewName('');
      fetchTrainingData(); // Refresh the list
    } catch (error) {
      console.error('Error renaming training data:', error);
      toast({
        title: "Error renaming training data",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const openRenameDialog = (item: TrainingData) => {
    setRenameDialog({ open: true, item });
    setNewName(item.data_type);
  };

  const getFileIcon = (dataType: string) => {
    if (dataType.toLowerCase().includes('rubric')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    return <File className="w-5 h-5 text-green-600" />;
  };

  const getBadgeColor = (dataType: string) => {
    if (dataType.toLowerCase().includes('rubric')) {
      return "bg-blue-100 text-blue-800";
    }
    return "bg-green-100 text-green-800";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Training Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-pulse">Loading training data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Training Data ({trainingData.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {trainingData.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No training data uploaded yet
            </h3>
            <p className="text-gray-600">
              Upload training examples to improve AI grading accuracy
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {trainingData.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(item.data_type)}
                  <div>
                    <p className="font-medium">{item.data_type}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      <Badge className={getBadgeColor(item.data_type)}>
                        {item.processed ? 'Processed' : 'Processing'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <AlertDialog>
                  <Dialog open={renameDialog.open && renameDialog.item?.id === item.id} onOpenChange={(open) => {
                    if (!open) setRenameDialog({ open: false, item: null });
                  }}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DialogTrigger asChild>
                          <DropdownMenuItem onClick={() => openRenameDialog(item)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                        </DialogTrigger>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Rename Training Data</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Name</label>
                          <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Enter new name"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setRenameDialog({ open: false, item: null })}>
                            Cancel
                          </Button>
                          <Button onClick={handleRename} disabled={!newName.trim()}>
                            Save
                          </Button>
                        </div>
                      </div>
                    </DialogContent>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Training Data</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{item.data_type}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(item.id, item.data_type)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </Dialog>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrainingDataManager;