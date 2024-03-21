package com.demo.model;

import com.demo.constant.Status.Status;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Message {
   private String senderName;
   private String receiverName;
   private String message;
   private String date;
   private Status status;

}
