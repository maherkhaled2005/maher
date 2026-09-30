const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'tecnorexa.db'));
const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}`;

async function loginUser(phone, password = 'password123') {
  let res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });
  let data = await res.json();

  if (res.status !== 200 && password !== '123456') {
    res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password: '123456' }),
    });
    data = await res.json();
  }

  if (data.requireOtp && data.tempToken) {
    const row = db.prepare("SELECT otpCode FROM users WHERE phone = ?").get(phone);
    const otpRes = await fetch(`${BASE_URL}/api/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken: data.tempToken, phone, otp: row?.otpCode }),
    });
    data = await otpRes.json();
    res = otpRes;
  }
  return { status: res.status, data, token: data.token, user: data.user };
}

async function apiRequest(method, endpoint, body = null, token = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  if (token) options.headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = await res.text();
  }
  return { status: res.status, data };
}

async function runTests() {
  console.log('==================================================');
  console.log('🧪 RUNNING SECTION 5 CUSTOMER SUPPORT E2E TESTS');
  console.log('==================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    const ts = Date.now();

    // 1. Register a fresh customer
    const customerPhone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;
    const regRes = await apiRequest('POST', '/api/auth/register', {
      name: `عميل الدعم ${ts}`,
      phone: customerPhone,
      password: 'password123',
      role: 'customer',
    });

    const customerToken = regRes.data?.token;
    const customerUser = regRes.data?.user;
    assert(customerToken && customerUser?.id, 'Customer registered and token received');

    // 2. Login as Customer Support Agent
    const supportLogin = await loginUser('01557470554', '123456');
    const supportToken = supportLogin.token;
    const supportUser = supportLogin.user;
    assert(supportToken && supportUser?.role === 'customer_support', 'Customer Support Agent logged in successfully');

    // 3. Customer creates a support ticket
    const ticketSubject = `عطل في غسالة ملابس #${ts}`;
    const ticketDesc = 'الغسالة لا تقوم بسحب المياه وتصدر صوتاً مزعجاً';
    const createTicketRes = await apiRequest('POST', '/api/support/tickets', {
      subject: ticketSubject,
      description: ticketDesc,
      category: 'فني',
      priority: 'high',
      customerName: customerUser.name,
      customerPhone: customerPhone,
    }, customerToken);

    assert(createTicketRes.status === 200, 'Ticket created successfully (200 OK)');
    const ticketId = createTicketRes.data?.id;
    assert(ticketId, `Ticket ID generated: ${ticketId}`);

    // 4. Verify ticket structure from GET /api/support/tickets/:id
    const getTicketRes = await apiRequest('GET', `/api/support/tickets/${ticketId}`, null, customerToken);
    const tData = getTicketRes.data;

    assert(getTicketRes.status === 200, 'Customer can fetch created ticket');
    assert(tData.customer && tData.customer.id === customerUser.id, 'Ticket contains customer object with matching id');
    assert(tData.status === 'open', 'Ticket initial status is "open"');
    assert(Array.isArray(tData.messages) && tData.messages.length >= 1, 'Ticket contains initial messages list');
    assert(tData.createdAt, 'Ticket has createdAt timestamp');
    assert(tData.updatedAt, 'Ticket has updatedAt timestamp');

    // 5. Customer sends a reply to their own ticket
    // Requirement 5.1: "لا تجعل المستخدم يرد على نفسه"
    // Customer must reply as customer to their own ticket.
    const custReplyMsg = 'أريد تحديد الموعد غداً صباحاً';
    const custReplyRes = await apiRequest('POST', `/api/support/tickets/${ticketId}/reply`, {
      message: custReplyMsg,
    }, customerToken);

    assert(custReplyRes.status === 200, 'Customer reply submitted successfully');
    const custReplyTicket = custReplyRes.data;
    const lastCustMsg = custReplyTicket.messages[custReplyTicket.messages.length - 1];
    assert(lastCustMsg.senderType === 'customer', 'Customer reply is saved as senderType: customer (never staff)');
    assert(lastCustMsg.isFromSupport === 0, 'Customer reply is marked as isFromSupport: 0');

    // 6. Support agent views the ticket
    const agentGetRes = await apiRequest('GET', `/api/support/tickets/${ticketId}`, null, supportToken);
    assert(agentGetRes.status === 200, 'Support agent can view customer ticket');
    assert(agentGetRes.data.messages.length >= 2, 'Support agent sees conversation history');

    // 7. Support agent replies to the ticket
    const agentReplyMsg = 'تم استلام طلبكم وجاري إرسال فني متخصص لفحص الغسالة غداً الساعة 10 صباحاً';
    const agentReplyRes = await apiRequest('POST', `/api/support/tickets/${ticketId}/reply`, {
      message: agentReplyMsg,
    }, supportToken);

    assert(agentReplyRes.status === 200, 'Support agent reply submitted successfully');
    const agentReplyTicket = agentReplyRes.data;
    const lastAgentMsg = agentReplyTicket.messages[agentReplyTicket.messages.length - 1];
    assert(lastAgentMsg.senderType === 'staff', 'Support reply saved as senderType: staff');
    assert(lastAgentMsg.isFromSupport === 1, 'Support reply marked as isFromSupport: 1');
    assert(agentReplyTicket.status === 'in_progress', 'Ticket status automatically transitioned to in_progress upon staff reply');
    assert(agentReplyTicket.supportAgent && agentReplyTicket.supportAgent.id === supportUser.id, 'supportAgent is assigned to the replying agent');

    // 8. Test Support Chat & Unread Count (Requirement 5.2)
    // Create direct conversation between customer and support agent
    const convRes = await apiRequest('POST', '/api/conversations', {
      name: `محادثة استفسار #${ts}`,
      type: 'direct',
      participants: [supportUser.id],
    }, customerToken);

    assert(convRes.status === 200 && convRes.data?.id, 'Direct conversation created between customer and support');
    const convId = convRes.data.id;

    // Customer sends a message to support agent
    const chatMsg = 'السلام عليكم، هل يوجد ضمان معتمد على قطع الغيار؟';
    const sendMsgRes = await apiRequest('POST', '/api/messages', {
      conversationId: convId,
      content: chatMsg,
      type: 'text',
    }, customerToken);

    assert(sendMsgRes.status === 200, 'Customer chat message sent successfully');

    // Support agent fetches conversations - unreadCount should be 1
    const agentConvsRes = await apiRequest('GET', '/api/conversations', null, supportToken);
    assert(agentConvsRes.status === 200, 'Support agent fetched conversations list');
    const targetConv = agentConvsRes.data.find((c) => String(c.id) === String(convId));
    assert(targetConv && targetConv.unreadCount >= 1, `Support agent receives unreadCount >= 1 (actual: ${targetConv?.unreadCount})`);

    // Support agent reads messages in conversation
    const readMsgsRes = await apiRequest('GET', `/api/messages/${convId}`, null, supportToken);
    assert(readMsgsRes.status === 200 && Array.isArray(readMsgsRes.data), 'Support agent read conversation messages');

    // Support agent fetches conversations again - unreadCount should now be 0
    const agentConvsAfterRes = await apiRequest('GET', '/api/conversations', null, supportToken);
    const targetConvAfter = agentConvsAfterRes.data.find((c) => String(c.id) === String(convId));
    assert(targetConvAfter && targetConvAfter.unreadCount === 0, `Unread count reset to 0 after opening messages (actual: ${targetConvAfter?.unreadCount})`);

    // 9. Support Ticket Escalation to Programming Team
    const escRes = await apiRequest('POST', `/api/support/tickets/${ticketId}/escalate`, {
      note: 'مشكلة فنية برمجية في معالجة طلب العميل تحتاج تدخل المطورين',
    }, supportToken);

    assert(escRes.status === 200, 'Support ticket escalated to programming team successfully');

    // Verify ticket status is now escalated
    const ticketEscCheck = await apiRequest('GET', `/api/support/tickets/${ticketId}`, null, supportToken);
    assert(ticketEscCheck.data?.status === 'escalated', 'Ticket status confirmed as "escalated"');

  } catch (err) {
    console.error('💥 Test suite encountered fatal error:', err);
    failed++;
  }

  console.log('==================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
