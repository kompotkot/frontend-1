/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useEffect, useState } from "react";
import AceEditor from "react-ace";
// import "brace/mode/json";
// import "brace/theme/github";

import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-twilight";
import { Flex } from "@chakra-ui/react";
// import "ace-builds/src-noconflict/ext-language_tools";

// const ace = require("ace-builds/src-noconflict/ace");

// useEffect(() => {

// })
// ace.edit()

const MyJsonComponent = ({
  json,
  onChange,
  readOnly = false,
}: {
  json: string;
  onChange?: (arg0: any) => void;
  readOnly?: boolean;
}) => {
  const handleJsonChange = (newValue: string) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <AceEditor
      style={{
        backgroundColor: "#232323",
        borderRadius: "10px",
        fontSize: "14px",
        padding: "10px",
      }}
      mode="json"
      theme="twilight"
      onChange={handleJsonChange}
      onLoad={function (editor) {
        editor.renderer.setPadding(20);
        editor.renderer.setScrollMargin(20, 20, 0, 0);
        editor.setReadOnly(readOnly);
      }}
      name="json-editor"
      editorProps={{ $blockScrolling: true }}
      value={json}
      height="300px"
      width="100%"
      setOptions={{ useWorker: false }}
    />
  );
};

export default MyJsonComponent;
