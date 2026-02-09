import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../store/store';
import { LocalizationProvider } from '../services/LocalizationProvider';

const ReduxProvider = ({ children }) => {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <LocalizationProvider>
                    {children}
                </LocalizationProvider>
            </PersistGate>
        </Provider>
    );
};

export default ReduxProvider;