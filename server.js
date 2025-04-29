const Koa = require('koa');
const fs = require('fs');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const { v4: uuidv4 } = require('uuid');

const app = new Koa();
const router = new Router();

let tickets = [];
const dataFile = './tickets.json';

// === Инициализация tickets из файла
if (fs.existsSync(dataFile)) {
  try {
    tickets = JSON.parse(fs.readFileSync(dataFile, 'utf8')) || [];
  } catch (err) {
    console.error('Ошибка чтения файла:', err);
    tickets = [];
  }
} else {
  tickets = [];
}

// === Middleware CORS
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type');
  if (ctx.method === 'OPTIONS') {
    ctx.status = 204;
  } else {
    await next();
  }
});

app.use(bodyParser());

// === GET allTickets and ticketById ===
router.get('/tickets', (ctx) => {
  const { method, id } = ctx.request.query;
  if (method === 'allTickets') {
    ctx.body = tickets.map(({ id, name, status, created }) => ({ id, name, status, created }));
    return;
  }
  if (method === 'ticketById') {
    const ticket = tickets.find(t => t.id === id);
    if (ticket) {
      ctx.body = ticket;
    } else {
      ctx.status = 404;
      ctx.body = { error: 'Ticket not found' };
    }
    return;
  }
  ctx.status = 404;
  ctx.body = { error: 'Method not found' };
});

// === POST createTicket ===
router.post('/tickets', (ctx) => {
  const { method, id } = ctx.request.query;
  if (method === 'createTicket') {
    const { name, description, status } = ctx.request.body;
    const newTicket = {
      id: uuidv4(),
      name,
      description,
      status,
      created: Date.now(),
    };
    tickets.push(newTicket);
    fs.writeFileSync(dataFile, JSON.stringify(tickets, null, 2));
    ctx.status = 201;
    ctx.body = newTicket;
  } else if (method === 'deleteTicket') {
    // Удаление по id
    const idx = tickets.findIndex(t => t.id === id);
    if (idx !== -1) {
      tickets.splice(idx, 1);
      fs.writeFileSync(dataFile, JSON.stringify(tickets, null, 2));
      ctx.body = { success: true };
    } else {
      ctx.status = 404;
      ctx.body = { error: 'Ticket not found' };
    }
  } else if (method === 'editTicket') {
    // Редактирование по id
    const { name, description, status } = ctx.request.body;
    const ticket = tickets.find(t => t.id === id);
    if (ticket) {
      ticket.name = name;
      ticket.description = description;
      ticket.status = status;
      fs.writeFileSync(dataFile, JSON.stringify(tickets, null, 2));
      ctx.body = ticket;
    } else {
      ctx.status = 404;
      ctx.body = { error: 'Ticket not found' };
    }
  } else {
    ctx.status = 404;
    ctx.body = { error: 'Method not found' };
  }
});

app
  .use(router.routes())
  .use(router.allowedMethods());

// === Запуск сервера ===
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));
