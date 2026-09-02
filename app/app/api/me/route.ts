import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
export async function GET() { const user = await getChatGPTUser(); return NextResponse.json({ user, signInPath: user ? null : '/signin-with-chatgpt?return_to=%2F' }); }

