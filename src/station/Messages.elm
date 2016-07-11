port module Main exposing (..)

import Html exposing (..)
import Html.App as Html
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import WebSocket
import Date exposing (Date)
import Date.Format exposing (format)
import Json.Decode exposing (..)
import Json.Decode.Extra exposing (..)

main =
  Html.program
    { init = init
    , view = view
    , update = update
    , subscriptions = subscriptions
    }


-- MODEL


type MessageSource = WiFi | Satellite | GPRS | Radio

type MessageType = TestMessage | FaultMessage | PulseWidthMessage



messageTypeToString : MessageType -> String
messageTypeToString t =
    case t of
        TestMessage  -> "TestMessage"
        FaultMessage -> "FaultMessage"
        PulseWidthMessage -> "PulseWidthMessage"




type alias Message =
  { source: MessageSource
  , received: Date
  , mtype: MessageType
  , data: String
  }





type alias Model =
  { messages : List Message
  }


init : (Model, Cmd Msg)
init =
  (Model [], Cmd.none)



port graphData : (List (List (Maybe (List Float)))) -> Cmd msg
getGraphData = 
  let
    halfStepsTo14 =
      List.map (\x -> x / 2) [0..28]
    d1 =
      List.map (\x -> Just [x, sin x]) halfStepsTo14
    d2 =
      List.map Just [[0, 3], [4, 8], [8, 5], [9, 13]]
    d3 =
      [Just [0, 12], Just [7, 12], Nothing, Just [7, 2.5], Just [12, 2.5]]
  in
    [ d1, d2, d3 ]



decodeMessageSource : String -> MessageSource
decodeMessageSource str =
    case str of
        "WiFi"      -> WiFi
        "Satellite" -> Satellite
        "GPRS"      -> GPRS
        "Radio"     -> Radio
        otherwise   -> Debug.crash("Bad message source!")

decodeMessageType : String -> MessageType
decodeMessageType str =
    case str of
        "TestMessage"       -> TestMessage
        "FaultMessage"      -> FaultMessage
        "PulseWidthMessage" -> PulseWidthMessage
        otherwise           -> Debug.crash("Bad message type!")


type alias MessageHeader = { source: String, received: Date, mtype: String }


unpackOk : Result x a -> a
unpackOk res =
   case res of
      Ok  a -> a
      Err x -> Debug.crash "unpackOk: Don't call this function on an Err!"


decodeHeader : String -> (MessageSource, Date, MessageType)
decodeHeader str =
    let header = unpackOk (decodeString (object3 MessageHeader ("source" := string) ("received" := date) ("type" := string)) str)
    in (decodeMessageSource (.source header), .received header, decodeMessageType (.mtype header))


decodeMessage : String -> Message
decodeMessage str =
    let (source, date, mtype) = decodeHeader str
    in {source = source, received = date, mtype = mtype, data = "placeholder"}



-- UPDATE

type Msg
  = NewMessage String


update : Msg -> Model -> (Model, Cmd Msg)
update msg {messages} =
  case msg of
    NewMessage str ->
      (Model (List.append messages [decodeMessage str]), graphData getGraphData)


-- SUBSCRIPTIONS

subscriptions : Model -> Sub Msg
subscriptions model =
  WebSocket.listen "ws://localhost:3000/messages/realtime" NewMessage



-- Generate layout for a single message

messageLayout : Message -> Html Msg
messageLayout msg =
    div [] [
        table [class "message-table"] [
            tbody [] [
                tr [] [
                    td [class "message-source-icon-col"] [
                        case (.source msg) of
                            WiFi -> img [src "media/wifi.png"] []
                            Satellite -> img [src "media/satellite.png"] []
                            GPRS -> img [src "media/gprs.png"] []
                            Radio -> img [src "media/radio.png"] []
                    ],
                    td [class "message-received-date-col"] [
                        text (format "%Y-%m-%d %H:%M:%S" (.received msg))
                    ],
                    td [class "message-type-col"] [
                        text (messageTypeToString (.mtype msg))
                    ]
                ]
            ]
        ]
    ]

-- VIEW

view : Model -> Html Msg
view {messages} =
  div [] (List.map messageLayout messages)


viewMessage : String -> Html msg
viewMessage msg =
  div [] [ text msg ]






{-

var formatMessage = function(data) {
    var keys = [];
    var vals = [];

    $.each(data, function(k, v) {
        if (($.type(v) === 'object') || (v && Array === v.constructor)) {
            keys.push('[' + k + ']');
            vals.push('');

            var result = formatMessage(v);

            $.each(result.keys, function(_, rk) {
                keys.push('    ' + rk);
            });

            vals = vals.concat(result.vals);
        } else {
            keys.push(k);
            vals.push(v);
        }
    });

    return {
        keys: keys,
        vals: vals
    };
};

-}
