import React from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSatelliteDish, faTrash } from "@fortawesome/free-solid-svg-icons";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css

const Validators = ({ pubKeys, network, apiToken, updateValidators }) => {
    const [validatorData, setValidatorData] = React.useState();

    const beaconchainUrl = (validatorPubkey, text) => {
        const beaconChainBaseUrl = ({
            "prater": "https://prater.beaconcha.in",
            "mainnet": "https://beaconcha.in",
        })[network] || "https://beaconcha.in"
        return <a href={beaconChainBaseUrl + validatorPubkey}>{text ? text : validatorPubkey}</a>;
    }

    React.useEffect(() => {
        const getValidatorData = async (pubKey) => {
            const res = await axios.get(`http://teku.my.ava.do:5051/eth/v1/beacon/states/finalized/validators/${pubKey}`);
            if (res.status === 200) {
                // console.dir(res.data.data);
                return (res.data.data);
            }
        }

        if (pubKeys)
            Promise.all(pubKeys.map(pubKey => getValidatorData(pubKey))).then(
                result => setValidatorData(result)
            )
    }, [pubKeys]);

    function askConfirmationRemoveValidator(pubKey) {
        confirmAlert({
            message: `Are you sure you want to remove validator "${pubKey}"?`,
            buttons: [
                {
                    label: 'Remove',
                    onClick: () => removeValidator(pubKey)
                },
                {
                    label: 'Cancel',
                    onClick: () => { }
                }
            ]
        });
    }

    const removeValidator = (pubKey) => {
        //https://ethereum.github.io/keymanager-APIs/#/Local%20Key%20Manager/DeleteKeys
        const apiCall = async (pubKey) => {
            return await axios.delete("https://teku.my.ava.do:5052/eth/v1/keystores", {
                headers: { Authorization: `Bearer ${apiToken}` },
                data: { pubkeys: [pubKey] }
            }).then((res) => {
                console.dir(res)
                console.log(res)
                if (res.status === 200) {
                    updateValidators();
                }
            }).catch((e) => {
                console.log(e)
                console.dir(e)
            });
        }
        console.log("Deleting " + pubKey + " with token " + apiToken);
        apiCall(pubKey);
    }

    const getStatusColor = (status) => {
        switch (status) {
            // https://ethereum.github.io/beacon-APIs/#/ValidatorRequiredApi/getStateValidator
            case "pending_initialized": return "is-info" // When the first deposit is processed, but not enough funds are available (or not yet the end of the first epoch) to get validator into the activation queue.
            case "pending_queued": return "is-info" // When validator is waiting to get activated, and have enough funds etc. while in the queue, validator activation epoch keeps changing until it gets to the front and make it through (finalization is a requirement here too).
            case "active_ongoing": return "is-success" // When validator must be attesting, and have not initiated any exit.
            case "active_exiting": return "is-warning" // When validator is still active, but filed a voluntary request to exit.
            case "active_slashed": return "is-danger"// When validator is still active, but have a slashed status and is scheduled to exit.
            case "exited_unslashed": return "is-info"// When validator has reached reguler exit epoch, not being slashed, and doesn't have to attest any more, but cannot withdraw yet.
            case "exited_slashed": return "is-danger"// When validator has reached reguler exit epoch, but was slashed, have to wait for a longer withdrawal period.
            case "withdrawal_possible": return "is-info"// After validator has exited, a while later is permitted to move funds, and is truly out of the system.
            case "withdrawal_done": return "is-info"// (not possible in phase0, except slashing full balance)// actually having moved funds away
            default: return ""
        }
    }

    return (
        <div>
            {pubKeys && validatorData && (
                <>
                    <div className="notification is-success">
                        {beaconchainUrl("/dashboard?validators=" + validatorData.map(v => v.index).join(","), <>Beacon Chain Validator DashBoard <FontAwesomeIcon className="icon" icon={faSatelliteDish} /></>)}
                    </div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Public key</th>
                                <th>Index</th>
                                <th>Balance</th>
                                <th>Effective Balance</th>
                                {/* <th>Activation Epoch</th> */}
                                {/* <th>Exit Epoch</th> */}
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {validatorData.map(validator =>
                                <tr key={validator.index}>
                                    <td>{beaconchainUrl("/validator/" + validator.index, <FontAwesomeIcon className="icon" icon={faSatelliteDish} />)}</td>
                                    <th>{beaconchainUrl("/validator/" + validator.index, <abbr title={validator.validator.pubkey}>{validator.validator.pubkey.substring(0, 10) + "…"}</abbr>)}</th>
                                    <td>{beaconchainUrl("/validator/" + validator.index, validator.index)}</td>
                                    <td>{parseFloat(validator.balance / 1000000000).toFixed(4)}</td>
                                    <td>{parseFloat(validator.validator.effective_balance / 1000000000).toFixed(4)}</td>
                                    {/* <td>{validator.validator.activation_epoch}</td> */}
                                    {/* <td>{validator.validator.exit_epoch}</td> */}
                                    <td><span className={"tag " + getStatusColor(validator.status)}>{validator.status}</span></td>
                                    <td><a onClick={() => askConfirmationRemoveValidator(validator.validator.pubkey)}><FontAwesomeIcon className="icon" icon={faTrash} /></a></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

export default Validators