import { GoogleLogout } from 'react-google-login'
import { clientID } from '../config'

const Logout = () => {
    <div>
        <GoogleLogout 
        clientId={clientId}
        buttonText="Logout"
        onLogoutSuccess={props.onLogoutSuccess}>
        </GoogleLogout>
    </div>
}

export default Logout