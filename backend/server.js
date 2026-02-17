const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── In-Memory Data Store ────────────────────────────────────────────────────
const db = {
  teamMembers: [
    { id: uuidv4(), name: 'Alice Chen', color: '#6366f1' },
    { id: uuidv4(), name: 'Bob Martinez', color: '#f59e0b' },
    { id: uuidv4(), name: 'Carol Nguyen', color: '#10b981' },
    { id: uuidv4(), name: 'Dave Park', color: '#ef4444' },
  ],
  chores: [],
  choreInstances: [], // individual occurrences of chores on specific dates
  rotationIndex: {},  // choreId -> current index in rotation
};

// Seed some sample chores
function seedData() {
  const today = new Date();
  const members = db.teamMembers;

  const sampleChores = [
    {
      id: uuidv4(),
      title: 'Clean Kitchen',
      description: 'Wipe counters, load dishwasher, clean microwave',
      assigneeId: members[0].id,
      recurrence: { type: 'weekly', day: 1 }, // Monday
      autoRotate: true,
      rotationPool: members.map(m => m.id),
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      title: 'Restock Supplies',
      description: 'Check and restock paper towels, soap, coffee',
      assigneeId: members[1].id,
      recurrence: { type: 'biweekly', day: 3 }, // Wednesday
      autoRotate: false,
      rotationPool: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      title: 'Water Plants',
      description: 'Water all office plants and check soil moisture',
      assigneeId: members[2].id,
      recurrence: { type: 'daily' },
      autoRotate: true,
      rotationPool: [members[2].id, members[3].id],
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      title: 'Deep Clean Fridge',
      description: 'Remove expired items, wipe shelves, organize',
      assigneeId: members[3].id,
      recurrence: { type: 'monthly', dayOfMonth: 1 },
      autoRotate: false,
      rotationPool: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      title: 'Vacuum Common Areas',
      description: 'Vacuum the lobby, hallways, and meeting rooms',
      assigneeId: members[0].id,
      recurrence: { type: 'weekly', day: 5 }, // Friday
      autoRotate: true,
      rotationPool: members.map(m => m.id),
      createdAt: new Date().toISOString(),
    },
  ];

  db.chores = sampleChores;

  // Initialize rotation indices
  sampleChores.forEach(chore => {
    if (chore.autoRotate && chore.rotationPool.length > 0) {
      const idx = chore.rotationPool.indexOf(chore.assigneeId);
      db.rotationIndex[chore.id] = idx >= 0 ? idx : 0;
    }
  });

  // Generate instances for the current month ± 1 month
  generateInstances(
    new Date(today.getFullYear(), today.getMonth() - 1, 1),
    new Date(today.getFullYear(), today.getMonth() + 2, 0)
  );
}

// ─── Instance Generation ─────────────────────────────────────────────────────
function generateInstances(startDate, endDate) {
  // Clear existing instances in the range
  db.choreInstances = db.choreInstances.filter(inst => {
    const d = new Date(inst.date);
    return d < startDate || d > endDate;
  });

  for (const chore of db.chores) {
    const dates = getRecurrenceDates(chore.recurrence, startDate, endDate);
    dates.forEach((date, index) => {
      const existingInstance = db.choreInstances.find(
        i => i.choreId === chore.id && i.date === date
      );
      if (!existingInstance) {
        let assigneeId = chore.assigneeId;

        // Auto-rotate: cycle through rotation pool
        if (chore.autoRotate && chore.rotationPool.length > 0) {
          const baseIndex = db.rotationIndex[chore.id] || 0;
          const poolIndex = (baseIndex + index) % chore.rotationPool.length;
          assigneeId = chore.rotationPool[poolIndex];
        }

        db.choreInstances.push({
          id: uuidv4(),
          choreId: chore.id,
          title: chore.title,
          description: chore.description,
          assigneeId,
          date,
          status: new Date(date) < new Date(new Date().toISOString().split('T')[0]) ? 'overdue' : 'pending',
          completedAt: null,
        });
      }
    });
  }
}

function getRecurrenceDates(recurrence, startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);

  switch (recurrence.type) {
    case 'daily':
      while (current <= endDate) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
      break;

    case 'weekly':
      while (current <= endDate) {
        if (current.getDay() === recurrence.day) {
          dates.push(current.toISOString().split('T')[0]);
        }
        current.setDate(current.getDate() + 1);
      }
      break;

    case 'biweekly': {
      // Find the first occurrence of the target day
      while (current.getDay() !== recurrence.day && current <= endDate) {
        current.setDate(current.getDate() + 1);
      }
      while (current <= endDate) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 14);
      }
      break;
    }

    case 'monthly':
      while (current <= endDate) {
        const target = new Date(current.getFullYear(), current.getMonth(), recurrence.dayOfMonth);
        if (target >= startDate && target <= endDate) {
          dates.push(target.toISOString().split('T')[0]);
        }
        current.setMonth(current.getMonth() + 1);
        current.setDate(1);
      }
      break;

    case 'once':
      if (recurrence.date) {
        const d = new Date(recurrence.date);
        if (d >= startDate && d <= endDate) {
          dates.push(recurrence.date);
        }
      }
      break;
  }

  return [...new Set(dates)].sort();
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// Team Members
app.get('/api/team', (req, res) => {
  res.json(db.teamMembers);
});

app.post('/api/team', (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const member = { id: uuidv4(), name, color: color || randomColor() };
  db.teamMembers.push(member);
  res.status(201).json(member);
});

app.delete('/api/team/:id', (req, res) => {
  const idx = db.teamMembers.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Member not found' });

  // Remove member from chore assignments and rotation pools
  db.chores.forEach(chore => {
    if (chore.assigneeId === req.params.id) {
      chore.assigneeId = null;
    }
    chore.rotationPool = chore.rotationPool.filter(id => id !== req.params.id);
  });

  db.teamMembers.splice(idx, 1);
  res.json({ success: true });
});

// Chores
app.get('/api/chores', (req, res) => {
  res.json(db.chores);
});

app.post('/api/chores', (req, res) => {
  const { title, description, assigneeId, recurrence, autoRotate, rotationPool } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const chore = {
    id: uuidv4(),
    title,
    description: description || '',
    assigneeId: assigneeId || null,
    recurrence: recurrence || { type: 'once', date: new Date().toISOString().split('T')[0] },
    autoRotate: autoRotate || false,
    rotationPool: rotationPool || [],
    createdAt: new Date().toISOString(),
  };

  db.chores.push(chore);

  if (chore.autoRotate && chore.rotationPool.length > 0) {
    db.rotationIndex[chore.id] = 0;
  }

  // Regenerate instances
  const today = new Date();
  generateInstances(
    new Date(today.getFullYear(), today.getMonth() - 1, 1),
    new Date(today.getFullYear(), today.getMonth() + 2, 0)
  );

  res.status(201).json(chore);
});

app.put('/api/chores/:id', (req, res) => {
  const chore = db.chores.find(c => c.id === req.params.id);
  if (!chore) return res.status(404).json({ error: 'Chore not found' });

  const { title, description, assigneeId, recurrence, autoRotate, rotationPool } = req.body;
  if (title !== undefined) chore.title = title;
  if (description !== undefined) chore.description = description;
  if (assigneeId !== undefined) chore.assigneeId = assigneeId;
  if (recurrence !== undefined) chore.recurrence = recurrence;
  if (autoRotate !== undefined) chore.autoRotate = autoRotate;
  if (rotationPool !== undefined) chore.rotationPool = rotationPool;

  // Regenerate instances
  db.choreInstances = db.choreInstances.filter(i => i.choreId !== chore.id);
  const today = new Date();
  generateInstances(
    new Date(today.getFullYear(), today.getMonth() - 1, 1),
    new Date(today.getFullYear(), today.getMonth() + 2, 0)
  );

  res.json(chore);
});

app.delete('/api/chores/:id', (req, res) => {
  const idx = db.chores.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Chore not found' });

  db.choreInstances = db.choreInstances.filter(i => i.choreId !== req.params.id);
  delete db.rotationIndex[req.params.id];
  db.chores.splice(idx, 1);
  res.json({ success: true });
});

// Chore Instances (calendar events)
app.get('/api/instances', (req, res) => {
  const { start, end } = req.query;
  let instances = db.choreInstances;

  if (start) instances = instances.filter(i => i.date >= start);
  if (end) instances = instances.filter(i => i.date <= end);

  // Attach member info
  const enriched = instances.map(inst => {
    const member = db.teamMembers.find(m => m.id === inst.assigneeId);
    return {
      ...inst,
      assigneeName: member ? member.name : 'Unassigned',
      assigneeColor: member ? member.color : '#9ca3af',
    };
  });

  res.json(enriched);
});

// Update instance (mark complete, reassign, reschedule)
app.put('/api/instances/:id', (req, res) => {
  const instance = db.choreInstances.find(i => i.id === req.params.id);
  if (!instance) return res.status(404).json({ error: 'Instance not found' });

  const { status, assigneeId, date } = req.body;
  if (status !== undefined) {
    instance.status = status;
    instance.completedAt = status === 'done' ? new Date().toISOString() : null;
  }
  if (assigneeId !== undefined) instance.assigneeId = assigneeId;
  if (date !== undefined) instance.date = date;

  const member = db.teamMembers.find(m => m.id === instance.assigneeId);
  res.json({
    ...instance,
    assigneeName: member ? member.name : 'Unassigned',
    assigneeColor: member ? member.color : '#9ca3af',
  });
});

// Refresh / regenerate instances for a date range
app.post('/api/instances/generate', (req, res) => {
  const { start, end } = req.body;
  generateInstances(new Date(start), new Date(end));
  res.json({ success: true, count: db.choreInstances.length });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function randomColor() {
  const colors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ─── Initialize & Start ──────────────────────────────────────────────────────
seedData();

app.listen(PORT, () => {
  console.log(`🧹 Chore App API running on http://localhost:${PORT}`);
  console.log(`   Team members: ${db.teamMembers.length}`);
  console.log(`   Chores: ${db.chores.length}`);
  console.log(`   Instances: ${db.choreInstances.length}`);
});
