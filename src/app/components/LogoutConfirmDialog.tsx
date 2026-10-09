import { AlertCircle } from "lucide-react";
import { Button } from "./ui/button";

interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LogoutConfirmDialog({ isOpen, onConfirm, onCancel }: LogoutConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onCancel}
      >
        {/* Dialog */}
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <div className="flex justify-center pt-8 pb-4">
            <div className="size-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="size-8 text-red-600" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center px-6 pb-6">
            <h3 className="text-[20px] text-gray-900 mb-2" style={{ fontWeight: 600 }}>
              Are you sure you want to logout?
            </h3>
            <p className="text-[14px] text-gray-600" style={{ fontWeight: 400 }}>
              You will need to sign in again to access the system.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-0 border-t border-gray-200">
            <Button 
              variant="ghost"
              className="flex-1 h-14 text-[15px] rounded-none hover:bg-gray-50 text-gray-700"
              onClick={onCancel}
              style={{ fontWeight: 600 }}
            >
              No
            </Button>
            <div className="w-px bg-gray-200" />
            <Button 
              variant="ghost"
              className="flex-1 h-14 text-[15px] rounded-none hover:bg-red-50 text-red-600"
              onClick={onConfirm}
              style={{ fontWeight: 600 }}
            >
              Yes
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}