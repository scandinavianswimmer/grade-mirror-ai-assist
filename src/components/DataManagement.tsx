
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Download, Trash2, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { exportUserData, deleteAllUserData } from '@/lib/privacyApi'
import { useToast } from '@/hooks/use-toast'

const DataManagement = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleExportData = async () => {
    if (!user) return

    setIsExporting(true)
    try {
      const userData = await exportUserData(user.id)
      
      // Create and download JSON file
      const dataStr = JSON.stringify(userData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `grademirror-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      
      toast({
        title: "Data exported successfully",
        description: "Your data has been downloaded as a JSON file."
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your data.",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAllData = async () => {
    if (!user) return

    setIsDeleting(true)
    try {
      await deleteAllUserData(user.id)
      
      toast({
        title: "Data deletion initiated",
        description: "All your data has been permanently deleted."
      })
    } catch (error) {
      toast({
        title: "Deletion failed",
        description: "There was an error deleting your data.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Data Export */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Data Access & Control</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">Download My Data</p>
                <p className="text-sm text-gray-600">Export all your data in a portable JSON format</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleExportData}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Download'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 bg-red-50 border-red-200">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-900">Delete All Data</p>
              <p className="text-sm text-red-700">
                Permanently delete all your uploaded content, grades, and training data
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete All'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all your data including:
                    <br />• All assignments and submissions
                    <br />• All rubrics and training data
                    <br />• All LMS integrations
                    <br />• All privacy settings
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAllData}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default DataManagement
