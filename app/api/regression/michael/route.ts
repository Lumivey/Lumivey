import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const MICHAEL_TURNS = [
  "Het is hier avond. Werken jullie in het buitenland? Ik wil een website hebben want ik wil klanten hebben.",
  "Nog niet een bedrijf. Ik ben student en ik wil bijverdienen.",
  "Luxe auto's en sportwagens wassen, detailleren, poetsen. Maar dan op een hele goede manier met topproducten. Ik gebruik alleen Meguiars uit America. Diep reinigen, kleien en polijsten, en een harde was laag. Kan ook met een wetlook als de klant dat wil. Maar ik wil alleen maar het topsegment doe.",
  "Mijn vader heeft een oude Porsche 356 en daar is het mee begonnen.",
  "Haha een wasstraat? Daar krijg je alleen maar swirls van in je lak. Nooit doen!",
];

const REFERENCE_EXPECTATIONS = [
  "Corrigeert tijdstip kort, bevestigt dat buitenland mogelijk is en vraagt wat voor bedrijf/werk de ondernemer wil doen.",
  "Laat de oppervlakkige wens 'klanten krijgen' los en vraagt wat de student voor klanten wil gaan doen.",
  "Herkent topsegment/detailing als meer dan bijverdienen en opent één persoonlijke deur: welke auto veroorzaakte de eerste echte fascinatie.",
  "Begrijpt Porsche 356 als oorsprong van zorg/respect voor bijzondere auto's en koppelt dit voorzichtig aan topsegment.",
  "Herkent de spontane energie rond 'swirls' als betekenisvolle deur: niet alleen schoonmaken maar schade voorkomen, perfectie behouden en respect voor lak.",
];

export async function GET(request: Request) {
  const messages: ChatMessage[] = [];
  const replay: Array<{
    turn: number;
    user: string;
    assistant: string;
    referenceExpectation: string;
  }> = [];

  const base = new URL(request.url).origin;

  for (let index = 0; index < MICHAEL_TURNS.length; index += 1) {
    const user = MICHAEL_TURNS[index];
    messages.push({ role: "user", content: user });

    const response = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, sourceContexts: [] }),
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.error || `Replay stopte bij beurt ${index + 1}.`,
          replay,
        },
        { status: response.status }
      );
    }

    const assistant = String(data.reply || "");
    messages.push({ role: "assistant", content: assistant });
    replay.push({
      turn: index + 1,
      user,
      assistant,
      referenceExpectation: REFERENCE_EXPECTATIONS[index],
    });
  }

  return NextResponse.json({
    case: "Michael / high-end detailing",
    purpose: "Golden Path replay — first five text-only turns before the photo enters the June reference conversation.",
    note: "This endpoint deliberately stops before the photo-dependent part. It is for finding the first behavioral deviation, not for judging the final preview.",
    replay,
  });
}
