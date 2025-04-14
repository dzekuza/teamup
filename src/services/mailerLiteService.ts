import MailerLite from '@mailerlite/mailerlite-nodejs';

const mailerlite = new MailerLite({
  api_key: process.env.REACT_APP_MAILERLITE_API_KEY || '',
});

export interface SubscriberData {
  email: string;
  name?: string;
  fields?: {
    [key: string]: string;
  };
}

export const addSubscriber = async (data: SubscriberData) => {
  try {
    const response = await mailerlite.subscribers.createOrUpdate({
      email: data.email,
      fields: {
        name: data.name || '',
        ...data.fields,
      },
    });
    return { success: true, data: response };
  } catch (error) {
    console.error('Error adding subscriber to MailerLite:', error);
    return { success: false, error };
  }
};

export const addSubscriberToGroup = async (email: string, groupId: string) => {
  try {
    // First, ensure the subscriber exists
    await addSubscriber({ email });
    
    // Then add them to the group using the correct API method
    const response = await mailerlite.groups.assignSubscriber(groupId, email);
    return { success: true, data: response };
  } catch (error) {
    console.error('Error adding subscriber to group:', error);
    return { success: false, error };
  }
};

export const removeSubscriberFromGroup = async (email: string, groupId: string) => {
  try {
    const response = await mailerlite.groups.unAssignSubscriber(groupId, email);
    return { success: true, data: response };
  } catch (error) {
    console.error('Error removing subscriber from group:', error);
    return { success: false, error };
  }
};

// Group IDs for different automation flows
export const MAILERLITE_GROUPS = {
  WELCOME_SERIES: 'welcome_series',
  EVENT_CREATORS: 'event_creators',
  EVENT_PARTICIPANTS: 'event_participants',
  FRIEND_SYSTEM: 'friend_system',
  INACTIVE_USERS: 'inactive_users',
};

// Add a new user to the welcome series
export const addUserToWelcomeSeries = async (email: string, name?: string) => {
  const subscriberData: SubscriberData = {
    email,
    name,
    fields: {
      signup_date: new Date().toISOString(),
    },
  };

  const result = await addSubscriber(subscriberData);
  if (result.success) {
    await addSubscriberToGroup(email, MAILERLITE_GROUPS.WELCOME_SERIES);
  }
  return result;
};

// Add an event creator to the event creators group
export const addEventCreator = async (email: string, name?: string) => {
  const subscriberData: SubscriberData = {
    email,
    name,
    fields: {
      user_type: 'event_creator',
      first_event_date: new Date().toISOString(),
    },
  };

  const result = await addSubscriber(subscriberData);
  if (result.success) {
    await addSubscriberToGroup(email, MAILERLITE_GROUPS.EVENT_CREATORS);
  }
  return result;
};

// Add an event participant to the participants group
export const addEventParticipant = async (email: string, name?: string) => {
  const subscriberData: SubscriberData = {
    email,
    name,
    fields: {
      user_type: 'event_participant',
      first_event_date: new Date().toISOString(),
    },
  };

  const result = await addSubscriber(subscriberData);
  if (result.success) {
    await addSubscriberToGroup(email, MAILERLITE_GROUPS.EVENT_PARTICIPANTS);
  }
  return result;
};

// Mark a user as inactive
export const markUserInactive = async (email: string) => {
  const subscriberData: SubscriberData = {
    email,
    fields: {
      last_active: new Date().toISOString(),
      status: 'inactive',
    },
  };

  const result = await addSubscriber(subscriberData);
  if (result.success) {
    await addSubscriberToGroup(email, MAILERLITE_GROUPS.INACTIVE_USERS);
  }
  return result;
}; 