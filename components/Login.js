import { GoogleLogin, GoogleLogout } from 'react-google-login'
import { clientID } from '../config'
import { useState } from 'react'

console.log(clientID)

const success = response => {
    console.log(response)
}

const error = response => {
    console.log(response)
}

const loading = () => {
    console.log('loading')
}

const logout = () => {
    console.log('logout')
}

const getStaticProps = async () => {
    const res = await fetch(`https://billingbudgets.googleapis.com/v1/{parent=billingAccounts/*}/budgets`)
    const budget = await res.json()
    return {
        props: { budget ,},
    }
}

const MountTest = () => {
    const[showButton, toggleShow] = useState(true)

    if (showButton) {
        return (
            <GoogleLogin
                onSuccess={res => {
                    toggleShow(false)
                    success(res)
                }}
                onFailure={error}
                clientId={clientID}
                onRequest={loading}
                scope="https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/devstorage.read_write https://www.googleapis.com/auth/cloud-language"
                cookiePolicy={'single_host_origin'}
                style={{ marginTop: '100px' }}
                responseType="id_token"
                isSignedIn
            > Auth then Hide
            </GoogleLogin>
        )
    }

    return  <GoogleLogout onLogoutSuccess={logout}/>
}


const Login = () => {
    return (
        <div>
            <MountTest/>
        </div>

    )

}

export default Login