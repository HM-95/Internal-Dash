const fetch = global.fetch || require('node-fetch');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, companyName } = req.body;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Buzzberry <hey@buzzberry.io>',
      to: [email],
      subject: 'Thanks for joining the Buzzberry waitlist!',
      html: `
        <div style="font-family: Arial, sans-serif; background: #f8f9fa; padding: 32px; border-radius: 16px; max-width: 480px; margin: 0 auto;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
            <img src="https://app.buzzberry.io/BuzzberryIcon.png" alt="Buzzberry Icon" style="width: 40px; height: 40px; border-radius: 8px; box-shadow: 0 2px 8px #0001;" />
            <img src="https://app.buzzberry.io/Buzzberry%20black%20logo(4)%201.png" alt="Buzzberry Logo" style="height: 20px; width: auto; display: block;" />
          </div>
          <h2 style="color: #d266a3; font-size: 1.5rem; margin-bottom: 12px;">Welcome to the Buzzberry Waitlist!</h2>
          <p style="color: #1e1e1e; font-size: 1rem; margin-bottom: 16px;">
            Hi there,<br><br>
            Thank you for joining the Buzzberry waitlist. We're excited to have you on board!<br><br>
            <strong>Company:</strong> ${companyName}
          </p>
          <p style="color: #757575; font-size: 0.95rem; margin-bottom: 24px;">
            We'll keep you updated on our launch and next steps.<br>
            If you have any questions, just reply to this email.<br><br>
            Cheers,<br>
            <span style="color: #d266a3; font-weight: bold;">The Buzzberry Team</span>
          </p>
        </div>
      `,
    }),
  });

  if (response.ok) {
    res.status(200).json({ success: true });
  } else {
    const error = await response.json();
    res.status(500).json({ error });
  }
}; 