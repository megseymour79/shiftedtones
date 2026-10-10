import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NBButton } from "@/components/nb";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useAuth } from "@/hooks/use-auth";

export default function PrivacyPolicy() {
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 text-neutral-800">
      <h1 className="mb-2 text-3xl font-bold">Privacy Policy for ShiftedTone</h1>
      <p className="mb-6 text-sm text-neutral-500">Effective: October 10, 2026</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="mb-2 text-xl font-semibold">1. What we collect</h2>
          <p>
            We process your account email and authentication records, saved
            practice scores and voice metrics, any context or reframe text you
            provide, optional speech transcripts, and generated coaching notes.
            We use this information to provide sign-in, save progress, and
            deliver the app's coaching features.
          </p>
          <p>
            Microphone audio is analyzed in your browser; recordings are kept
            temporarily in the browser for playback and are not uploaded to our
            app backend. Speech-to-text is off by default. If you enable it,
            your browser's speech-recognition service may process the audio. A
            transcript is saved only when you save the take.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">2. Service providers</h2>
          <p>
            We use Convex to host account and progress data. When you request
            AI-generated coaching, the text and context needed to answer your
            request are sent through the configured Vly AI integration to its
            model provider. Email addresses and sign-in codes are sent through
            the configured email service. These providers process information
            under their own terms and retention practices.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">3. Analytics and diagnostics</h2>
          <p>
            If enabled by the operator, Plausible receives page views and
            product events. If error monitoring is configured, technical error
            details, stack traces, and the current page URL may be sent to the
            configured Vly monitoring service. These services are not
            initialized when their configuration is absent.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">4. Retention and deletion</h2>
          <p>
            We retain account and saved app data until you delete your account.
            Use the control below while signed in to permanently delete the
            account and associated app and authentication records. Data already
            sent to third-party providers may remain subject to their retention
            policies.
          </p>
          <AccountDeletionControl />
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">5. Your requests and contact</h2>
          <p>
            {supportEmail ? (
              <>
                For privacy requests, including questions about your data, or
                support, email{" "}
                <a className="underline" href={`mailto:${supportEmail}`}>
                  {supportEmail}
                </a>
                .
              </>
            ) : (
              "A support contact will be published before launch."
            )}
          </p>
          <p className="mt-2">
            You can use this contact to ask questions or request access,
            correction, or deletion of your data.
          </p>
        </div>
      </section>
    </main>
  );
}

function AccountDeletionControl() {
  const { isAuthenticated, signOut } = useAuth();
  const deleteAccount = useMutation(api.users.deleteAccount);
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated) return null;

  const confirmDeletion = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteAccount({});
      try {
        await signOut();
      } catch {
        // The account mutation also removes its auth sessions.
      }
      window.location.replace("/");
    } catch {
      setError("We couldn't delete your account. Please try again or contact support.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="mt-4">
      <NBButton
        type="button"
        variant="coral"
        onClick={() => setOpen(true)}
      >
        Delete account and data
      </NBButton>
      <AlertDialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!isDeleting) setOpen(nextOpen);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your saved practice data and account.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <NBButton
              type="button"
              variant="coral"
              disabled={isDeleting}
              onClick={confirmDeletion}
            >
              {isDeleting ? "Deleting…" : "Delete account"}
            </NBButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
