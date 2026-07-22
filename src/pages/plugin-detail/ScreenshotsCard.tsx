import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";

export function ScreenshotsCard({
  name, screenshots, onOpen,
}: { name: string; screenshots: string[]; onOpen: (url: string) => void }) {
  if (!screenshots?.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Screenshots</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {screenshots.map((url, i) => (
            <button
              key={i}
              onClick={() => onOpen(url)}
              className="rounded overflow-hidden border hover:ring-2 hover:ring-primary transition"
            >
              <img
                src={url}
                alt={`${name} — screenshot ${i + 1}`}
                className="w-full aspect-video object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
