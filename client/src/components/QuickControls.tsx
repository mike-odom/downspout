import * as React from "react";

import {NetworkController} from "../controllers/NetworkController";

interface QuickControlsProps {

}

interface QuickControlsState {

}

class QuickControls extends React.Component<QuickControlsProps, QuickControlsState> {
    render() {
        return (
            <div>
                <div className="quickAction" onClick={this.scanClicked}>Scan FTP</div>
            </div>
        )
    }

    scanClicked() {
        NetworkController.instance().requestScan();
    }
}

export { QuickControls }