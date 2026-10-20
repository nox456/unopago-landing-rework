/* Subtítulos del video de presentación (~29 s). `es` es la transcripción de
   media/cobrar-cliente.mp4 y `en` la del doblaje media/cobrar-cliente-en.mp4.
   Formato WebVTT pegado tal cual: se puede exportar desde cualquier editor de
   subtítulos y reemplazar el bloque completo. Va en JS y no como archivo .vtt
   porque al abrir la landing con file:// el navegador bloquea los <track src>. */
window.VP_SUBTITLES = {
  es: `WEBVTT

00:00:00.000 --> 00:00:03.900
Para comenzar, busca y selecciona el cliente desde la barra superior.

00:00:04.180 --> 00:00:07.420
Una vez en su perfil, haz clic en Crear orden.

00:00:07.900 --> 00:00:14.060
Verifica la fecha de emisión, la fecha de vencimiento
y selecciona la moneda correspondiente.

00:00:14.320 --> 00:00:17.720
Ingresa una breve descripción general de la orden.

00:00:17.920 --> 00:00:20.220
Añade el concepto a facturar y el monto.

00:00:20.400 --> 00:00:22.140
Guarda los cambios en Crear orden.

00:00:22.380 --> 00:00:27.840
¡Listo! La orden quedará registrada y podrás hacer clic
sobre ella para ver todos sus detalles.
`,
  en: `WEBVTT

00:00:00.000 --> 00:00:03.900
To get started, search for and select the customer from the top bar.

00:00:04.180 --> 00:00:07.420
Once you're on their profile, click Create order.

00:00:07.900 --> 00:00:14.060
Check the issue date and the due date,
then select the right currency.

00:00:14.320 --> 00:00:17.720
Enter a brief general description of the order.

00:00:17.920 --> 00:00:20.220
Add the item to bill and the amount.

00:00:20.400 --> 00:00:22.140
Click Create order to save.

00:00:22.380 --> 00:00:27.840
Done! The order is now saved, and you can click
on it to see all of its details.
`
};
