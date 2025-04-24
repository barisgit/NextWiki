"use client";

import { useState } from "react";
import { Button, Modal } from "@repo/ui";
import { toast } from "sonner";
import { useTRPC } from "~/server/client";
import { logger } from "@repo/logger";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

// Define a type for the validation status
type ValidationStatus =
  | {
      isValid: true;
      missingCount: number;
      extrasCount: number;
      mismatchedCount: number;
      error?: false; // Explicitly indicate no error
    }
  | {
      isValid: false;
      missingCount: number;
      extrasCount: number;
      mismatchedCount: number;
      error?: false; // Explicitly indicate no error
    }
  | {
      isValid: false;
      error: true; // Indicate validation failed due to an error
      message?: string;
    }
  | undefined; // Initial state

export function PermissionsActions() {
  const trpc = useTRPC();
  const [validationStatus, setValidationStatus] =
    useState<ValidationStatus>(undefined);
  const [showFixModal, setShowFixModal] = useState<boolean | null>(null); // true for removeExtras, false otherwise, null if closed

  const validateMutation = useMutation(
    trpc.admin.permissions.validate.mutationOptions({
      onSuccess: (data) => {
        // Explicitly create the correct ValidationStatus variant
        const newStatus: ValidationStatus = data.isValid
          ? {
              isValid: true,
              missingCount: data.missingCount,
              extrasCount: data.extrasCount,
              mismatchedCount: data.mismatchedCount,
              error: false, // Ensure error is explicitly false
            }
          : {
              isValid: false,
              missingCount: data.missingCount,
              extrasCount: data.extrasCount,
              mismatchedCount: data.mismatchedCount,
              error: false, // Ensure error is explicitly false
            };
        setValidationStatus(newStatus); // Store the validation result

        if (newStatus.isValid) {
          toast.success("Permissions Validation Successful", {
            description: "Registry and database permissions match.",
          });
        } else {
          toast.warning("Permissions Validation Issues Found", {
            description: `Missing: ${newStatus.missingCount}, Extras: ${newStatus.extrasCount}, Mismatched: ${newStatus.mismatchedCount}. Use 'Fix Permissions' to resolve.`,
          });
        }
        logger.log("Validation Result:", data);
      },
      onError: (error) => {
        setValidationStatus({
          isValid: false,
          error: true,
          message: error.message,
        }); // Store error state
        toast.error("Permissions Validation Failed", {
          description: error.message,
        });
        logger.error("Validation Error:", error);
      },
    })
  );

  const fixMutation = useMutation(
    trpc.admin.permissions.fix.mutationOptions({
      // onMutate is handled by modal state now
      onSuccess: (data) => {
        toast.success("Permissions Fix Successful", {
          description: `Added: ${data.added}, Updated: ${data.updated}, Removed: ${data.removed}. Re-validating...`,
        });
        logger.log("Fix Result:", data);
      },
      onError: (error) => {
        toast.error("Permissions Fix Failed", {
          description: error.message,
        });
        logger.error("Fix Error:", error);
      },
      onSettled: () => {
        setShowFixModal(null); // Close modal on settle
        // Re-run validation after fix attempt
        validateMutation.mutate();
      },
    })
  );

  const handleValidate = () => {
    setValidationStatus(undefined); // Reset status before validating
    validateMutation.mutate();
  };

  // This function now opens the modal
  const handleInitiateFix = (removeExtras = false) => {
    setShowFixModal(removeExtras);
  };

  // This function confirms the fix from the modal
  const handleConfirmFix = () => {
    if (showFixModal === null) return; // Should not happen, but safeguard
    fixMutation.mutate({ removeExtras: showFixModal });
  };

  const handleCloseModal = () => {
    if (!fixMutation.isPending) {
      setShowFixModal(null);
    }
  };

  // Determine if fix actions should be enabled
  const canFix =
    validationStatus !== undefined &&
    !validationStatus.isValid &&
    !validationStatus.error;

  return (
    <>
      <div className="bg-background-level1 mt-6 flex flex-wrap items-center gap-4 rounded-md p-4">
        <Button
          onClick={handleValidate}
          loading={validateMutation.isPending}
          disabled={validateMutation.isPending || fixMutation.isPending}
          variant="outlined"
        >
          {validateMutation.isPending
            ? "Validating..."
            : "Validate Permissions"}
        </Button>

        {/* Conditionally render validation status */}
        {validationStatus && !validateMutation.isPending && (
          <div className="flex items-center gap-2 text-sm">
            {validationStatus.isValid ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-text-secondary">
                  Permissions are valid.
                </span>
              </>
            ) : validationStatus.error ? (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-text-error">
                  Validation failed. Check logs.
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span className="text-text-warning">
                  Issues found: {validationStatus.missingCount} Missing,{" "}
                  {validationStatus.extrasCount} Extras,{" "}
                  {validationStatus.mismatchedCount} Mismatched.
                </span>
              </>
            )}
          </div>
        )}

        <div className="flex flex-grow justify-end gap-4">
          <Button
            onClick={() => handleInitiateFix(false)}
            disabled={
              !canFix || fixMutation.isPending || validateMutation.isPending
            }
            variant="outlined"
            color="warning"
          >
            Fix Permissions (Keep Extras)
          </Button>
          <Button
            onClick={() => handleInitiateFix(true)}
            disabled={
              !canFix || fixMutation.isPending || validateMutation.isPending
            }
            variant="outlined"
            color="error"
          >
            Fix Permissions (Remove Extras)
          </Button>
        </div>
        <p className="text-text-tertiary mt-2 w-full text-sm">
          Validate checks registry against DB. Fix actions are only available if
          validation fails. &apos;Remove Extras&apos; deletes DB permissions not
          in the code registry (potentially impactful).
        </p>
      </div>

      {/* Confirmation Modal */}
      {showFixModal !== null && (
        <Modal
          onClose={handleCloseModal}
          size="md"
          position="center"
          animation="fade"
          closeOnEscape={!fixMutation.isPending}
          showCloseButton={!fixMutation.isPending}
        >
          <div className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle
                className={`h-8 w-8 ${showFixModal ? "text-red-500" : "text-yellow-500"}`}
              />
              <h3 className="text-xl font-semibold">Confirm Permission Fix</h3>
            </div>
            <p className="text-text-secondary my-4">
              You are about to modify the permissions stored in the database
              based on the code registry.
              {showFixModal && (
                <span className="font-semibold text-red-600">
                  {" "}
                  This includes removing extra permissions found in the database
                  but not defined in the code.
                </span>
              )}
              {!showFixModal && (
                <span className="font-semibold text-yellow-600">
                  {" "}
                  This will add missing permissions and update mismatched ones,
                  but keep any extra permissions found in the database.
                </span>
              )}
              <br />
              This action can impact user access if not done carefully. Are you
              sure you want to proceed?
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={handleCloseModal}
                disabled={fixMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant={showFixModal ? "destructive" : "default"} // Use destructive variant for removing extras
                onClick={handleConfirmFix}
                loading={fixMutation.isPending}
                disabled={fixMutation.isPending}
              >
                {fixMutation.isPending ? "Fixing..." : "Confirm Fix"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
