import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  // Manejo de CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, x-client-trace-id",
      },
    });
  }

  try {
    const { to, subject, html, text, gmail, password, appPassword } = await req.json();

    // Preferir secretos de entorno en producción (no enviar credenciales desde el cliente)
    const ENV_GMAIL = Deno.env.get("GMAIL_USER");
    const ENV_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");

    const senderEmail = ENV_GMAIL || gmail;
    const senderPassword = ENV_APP_PASSWORD || appPassword || password;

    if (!to || !subject || !html || !senderEmail || !senderPassword) {
      const missing: string[] = [];
      if (!to) missing.push("to");
      if (!subject) missing.push("subject");
      if (!html) missing.push("html");
      if (!senderEmail) missing.push("senderEmail (GMAIL_USER o gmail)");
      if (!senderPassword) missing.push("senderPassword (GMAIL_APP_PASSWORD o appPassword/password)");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Campos requeridos faltantes",
          missing
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Importar nodemailer para Deno
    const nodemailer = await import("npm:nodemailer");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: senderEmail,
        pass: senderPassword,
      },
      secure: true,
      port: 465,
    });

    const mailOptions = {
      from: `"RH Compensamos" <${senderEmail}>`,
      to: to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ""),
    };

    const info = await transporter.sendMail(mailOptions);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: info.messageId,
        message: "Email enviado correctamente"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error al enviar el email",
        details: error instanceof Error ? error.message : "Error desconocido"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});