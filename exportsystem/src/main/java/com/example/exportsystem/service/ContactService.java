package com.example.exportsystem.service;

import com.example.exportsystem.dto.contact.ContactRequest;

public interface ContactService {
    // Notifies support of a new message from the public Contact Us page and
    // confirms receipt to the sender. Fire-and-forget - never throws for mail failures.
    void submit(ContactRequest request);
}
