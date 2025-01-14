import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {useCallableFunctionResponse} from 'reactfire';


export default function SgyAuthRedirect() {
    // Search params handling
    const { search } = useLocation();
    const searchParams = new URLSearchParams(search);
    const origin = searchParams.get('origin');
    const oauth_token = searchParams.get('oauth_token');

    const {status, data} = useCallableFunctionResponse('sgyauth', {data: {oauth_token: oauth_token}});

    useEffect(() => {
        if (status === 'error') console.error('Error occurred while calling sgyauth')
        if (status === 'success') window.location.href = `${origin}?modal=sgyauth`;
    }, [status])

    return (
        <span>Preparing to redirect you...</span>
    )
}
