const { google } = require('googleapis');

const CALENDAR_ID = '14b75b7ed5bc14409ed4370be8284163994de0e879e9c7322e75231a5a7c56cd@group.calendar.google.com';

function getAuth() {
  const base64 = process.env.GOOGLE_SERVICE_ACCOUNT;
  const jsonStr = Buffer.from(base64, 'base64').toString('utf8');
  const credentials = JSON.parse(jsonStr);

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      acao,          // 'criar' | 'atualizar' | 'excluir'
      eventId,       // para atualizar/excluir
      titulo,
      dataEntrada,
      dataSaida,
      horaEntrada,
      horaSaida,
      descricao,
    } = body;

    const auth = await getAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    // ── EXCLUIR EVENTO ──
    if (acao === 'excluir') {
      if (!eventId) {
        return { statusCode: 400, body: 'eventId obrigatório para exclusão' };
      }

      await calendar.events.delete({
        calendarId: CALENDAR_ID,
        eventId,
      });

      console.log('Evento excluído:', eventId);

      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true }),
      };
    }

    // ── CRIAR / ATUALIZAR EVENTO ──
    if (!dataEntrada || !dataSaida) {
      return { statusCode: 400, body: 'Datas obrigatórias' };
    }

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

    const requestBody = {
      summary:     titulo || 'Reserva - Casa do Céu',
      description: descricao || '',
      start: startObj,
      end:   endObj,
    };

    // ── ATUALIZAR EVENTO ──
    if (acao === 'atualizar' && eventId) {
      const response = await calendar.events.update({
        calendarId: CALENDAR_ID,
        eventId,
        requestBody,
      });

      console.log('Evento atualizado:', response.data.id);

      return {
        statusCode: 200,
        body: JSON.stringify({ eventId: response.data.id }),
      };
    }

    // ── CRIAR EVENTO ── (padrão)
    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody,
    });

    console.log('Evento criado:', response.data.id);

    return {
      statusCode: 200,
      body: JSON.stringify({ eventId: response.data.id }),
    };

  } catch (err) {
    console.error('Erro na função evento-calendario:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};