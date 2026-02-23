import React, { useState } from 'react';
import { router } from 'expo-router';
import { CreateEventSheet } from './(tabs)/create';

export default function CreateEventModal() {
    const [visible, setVisible] = useState(true);

    const handleDismiss = () => {
        setVisible(false);
        router.back();
    };

    return (
        <CreateEventSheet
            visible={visible}
            onDismiss={handleDismiss}
            asScreen
        />
    );
}
