import React from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import tekulogo from "../assets/teku.png";

const Comp = () => {
    const [syncData, setSyncData] = React.useState(undefined);
    const [error, setError] = React.useState();
    const [peerCount, setPeerCount] = React.useState();
    const [peers, setPeers] = React.useState();

    const updateStats = () => {
        axios.get(`http://teku.my.ava.do:5051/eth/v1/node/syncing`)
            .then(res => {
                if (res.status === 200) {
                    setError(null);
                    setSyncData(res.data.data);
                } else {
                    setError("Waiting for beacon chain to become ready");
                    setSyncData(null);
                }
            }).catch((e) => {
                setError("Waiting for beacon chain to become ready");
                setSyncData(null);
            });

        axios.get(`http://teku.my.ava.do:5051/eth/v1/node/peer_count`)
            .then(res => {
                if (res.status === 200) {
                    setPeerCount(res.data.data)
                }
            }).catch((e) => {
                //ignore
            });
        axios.get(`http://teku.my.ava.do:5051/eth/v1/node/peers`)
            .then(res => {
                if (res.status === 200) {
                    setPeers(res.data.data)
                }
            }).catch((e) => {
                //ignore
            });
    }

    React.useEffect(() => {
        updateStats();
        const interval = setInterval(() => {
            updateStats();
        }, 5 * 1000); // 5 seconds refresh
        return () => clearInterval(interval);
    }, []); // eslint-disable-line

    const getSyncPercentage = (syncData) => {
        const headSlot = parseFloat(syncData.head_slot)
        const total = headSlot + parseFloat(syncData.sync_distance)
        return (Math.floor(headSlot * 100.0 * 100.0 / total) / 100.0).toFixed(2) + "%" // round down to two decimal places
    }

    return (
        <>
            <div className="hero-body is-small is-primary py-0">
                <div className="columns">
                    <div className="column is-narrow">
                        <figure className="image is-64x64">
                            <img src={tekulogo} alt="Teku logo" />
                        </figure>
                    </div>
                    <div className="column">
                        <span>
                            <h1 className="title is-1 has-text-white">Avado Teku</h1>
                        </span>
                        <p>Teku beacon chain and validator</p>
                    </div>
                    <div className="column">
                        <p className="has-text-right">
                            {error
                                ? (
                                    <span className="tag is-danger">{error}<FontAwesomeIcon className="fa-spin" icon={faSpinner} /></span>
                                ) : (syncData && peerCount &&
                                    <>
                                        status: {(syncData.is_syncing === false && peerCount.connected > 0
                                        ) ? (<span className="tag is-success">in sync</span>
                                        ) : (<><span className="tag is-warning">syncing {getSyncPercentage(syncData)}</span>, sync distance: {syncData.sync_distance}</>
                                        )}
                                        <br />
                                        connected peers: {peerCount.connected}
                                        <br/>
                                        {(peers &&
                                            <> (Inbound: {peers.filter(p=>p.direction==="inbound").length}/Outbound: {peers.filter(p=>p.direction==="outbound").length})</>
                                        )} 
                                        
                                        <br />
                                        epoch: {Math.floor(syncData.head_slot / 32)}, slot {syncData.head_slot}
                                    </>
                                )}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );

}


export default Comp;