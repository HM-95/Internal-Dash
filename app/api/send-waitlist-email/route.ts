import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, companyName } = await request.json();

    // Here you would integrate with your email service (Resend, SendGrid, etc.)
    // For now, we'll just log the data
    console.log('Waitlist signup:', { email, companyName });

    // Example with Resend (you'll need to install @resend/node)
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'noreply@buzzberry.io',
    //   to: email,
    //   subject: 'Welcome to the BuzzBerry Waitlist!',
    //   html: `<p>Hi there!</p><p>Thanks for joining the BuzzBerry waitlist. We'll keep you updated on our progress.</p>`
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending waitlist email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 