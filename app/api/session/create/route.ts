import { NextRequest , NextResponse } from "next/server";
import { createSession } from "@/lib/supabase/helper";

export async function POST(req : NextRequest) {
    try {
        const { name, email } = await req.json();
        if( !name || !email ) {
            console.log("Invalid input:", { name, email })
            return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
        }
        const session = await createSession( name, email );
        return NextResponse.json({ sessionId: session.id });
    } catch (error) {
        console.error("Error creating session:", error instanceof Error ? error.message : error);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }
}
