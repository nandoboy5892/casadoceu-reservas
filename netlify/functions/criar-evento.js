const { google } = require('googleapis');

const CALENDAR_ID = '14b75b7ed5bc14409ed4370be8284163994de0e879e9c7322e75231a5a7c56cd@group.calendar.google.com';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { titulo, dataEntrada, dataSaida, horaEntrada, horaSaida, descricao } = body;

    if (!dataEntrada || !dataSaida) {
      return { statusCode: 400, body: 'Datas obrigatórias' };
    }

    // Decodifica Base64 → string JSON → objeto
    const base64 = process.env.GOOGLE_SERVICE_ACCOUNT;
    const jsonStr = Buffer.from(base64, 'base64').toString('utf8');
    const credentials = JSON.parse(jsonStr);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    let startObj, endObj;

    if (horaEntrada && horaSaida) {
      startObj = {
        dateTime: `${dataEntrada}T${horaEntrada}:00`,
        timeZone: 'America/Sao_Paulo',
      };
      endObj = {
        dateTime: `${dataSaida}T${horaSaida}:00`,
        timeZone: 'America/Sao_Paulo',
      };
    } else {
      startObj = { date: dataEntrada };
      endObj   = { date: dataSaida };
    }

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
        summary:     titulo || 'Reserva - Casa do Céu',
        description: descricao || '',
        start: startObj,
        end:   endObj,
      },
    });

    console.log('Evento criado com sucesso:', response.data.id);

    return {
      statusCode: 200,
      body: JSON.stringify({ eventId: response.data.id }),
    };

  } catch (err) {
    console.error('Erro ao criar evento:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};