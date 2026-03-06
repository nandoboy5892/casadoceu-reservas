const { google } = require('googleapis');

const CALENDAR_ID = '14b75b7ed5bc14409ed4370be8284163994de0e879e9c7322e75231a5a7c56cd@group.calendar.google.com';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { titulo, dataEntrada, dataSaida, descricao } = body;

    if (!dataEntrada || !dataSaida) {
      return { statusCode: 400, body: 'Datas obrigatórias' };
    }

    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
        summary: titulo || 'Reserva - Casa do Céu',
        description: descricao || '',
        start: {
          date: dataEntrada,
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          date: dataSaida,
          timeZone: 'America/Sao_Paulo',
        },
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ eventId: response.data.id }),
    };
  } catch (err) {
    console.error('Erro ao criar evento:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};