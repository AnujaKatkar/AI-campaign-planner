export default function SiteFooter({ onBehindTheBuild }: { onBehindTheBuild: () => void }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-5 py-6 text-sm text-muted sm:flex-row sm:items-center">
        <p>Flaunt · Stop hoping and start posting.</p>
        <button type="button" onClick={onBehindTheBuild} className="font-semibold underline-offset-4 hover:text-ink hover:underline">
          Behind the build
        </button>
      </div>
    </footer>
  );
}
