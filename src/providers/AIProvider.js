import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeAI } from '../store/slices/aiSlice';
import { getAIService } from '../ai';

/**
 * AI Provider Component
 * 
 * Handles initialization of AI services when the app starts.
 * Provides loading states and error handling for AI service initialization.
 */
const AIProvider = ({ children }) => {
    const dispatch = useDispatch();
    const { isInitialized, initializationError, isProcessing } = useSelector(state => state.ai);
    const [initializationAttempted, setInitializationAttempted] = React.useState(false);

    useEffect(() => {
        const initializeAIServices = async () => {
            // Only attempt initialization once and if AI services are not already initialized
            if (!isInitialized && !initializationAttempted && !initializationError) {
                setInitializationAttempted(true);

                try {
                    console.log('🤖 Starting AI services initialization...');

                    // Dispatch the initializeAI thunk
                    await dispatch(initializeAI()).unwrap();

                    console.log('✅ AI services initialized successfully');

                } catch (error) {
                    console.error('❌ AI services initialization failed:', error);
                    // Error is handled by the Redux slice
                }
            }
        };

        // Add a small delay to ensure the app is fully loaded
        const timeoutId = setTimeout(() => {
            initializeAIServices();
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [dispatch, isInitialized, initializationError, initializationAttempted]);

    // Optional: Preload AI service instance to avoid first-use delay
    useEffect(() => {
        if (isInitialized) {
            try {
                // Get the AI service instance to warm it up
                const aiService = getAIService();
                console.log('🔥 AI service warmed up and ready');
            } catch (error) {
                console.warn('⚠️ AI service warm-up failed:', error);
            }
        }
    }, [isInitialized]);

    // Render children - the loading/error states are handled by individual components
    return children;
};

/**
 * Higher-order component to wrap any component that needs AI initialization
 */
export const withAIInitialization = (WrappedComponent) => {
    return function AIInitializedComponent(props) {
        const { isInitialized, initializationError } = useSelector(state => state.ai);

        // If AI initialization failed, show a warning but still render the component
        if (initializationError) {
            console.warn('⚠️ AI services unavailable:', initializationError);
        }

        return <WrappedComponent {...props} />;
    };
};

export default AIProvider;